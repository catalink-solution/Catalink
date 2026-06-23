"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hasMarkedStorefrontShared } from "@/lib/onboarding-storage";
import {
  buildOnboardingSteps,
  isOnboardingComplete,
  onboardingProgress,
  type OnboardingStep,
  type OnboardingSnapshot,
} from "@/lib/vendor-onboarding";
import type { Shop } from "@/lib/types";

export type VendorOnboardingState = {
  loading: boolean;
  steps: OnboardingStep[];
  progress: number;
  complete: boolean;
  shopSlug: string | null;
  refresh: () => Promise<void>;
};

export function useVendorOnboarding(): VendorOnboardingState {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [shopSlug, setShopSlug] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSteps(buildOnboardingSteps(emptySnapshot()));
      setShopSlug(null);
      setLoading(false);
      return;
    }

    const { data: shopRow } = await supabase
      .from("shops")
      .select("id, name, slug, whatsapp")
      .eq("user_id", user.id)
      .maybeSingle();

    const shop = shopRow as Pick<Shop, "id" | "name" | "slug" | "whatsapp"> | null;
    setShopSlug(shop?.slug ?? null);

    let productCount = 0;
    let orderCount = 0;

    if (shop?.id) {
      const [{ count: pc }, { count: oc }] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id),
      ]);
      productCount = pc ?? 0;
      orderCount = oc ?? 0;
    }

    const snapshot: OnboardingSnapshot = {
      shop,
      productCount,
      orderCount,
      sharedStorefront: hasMarkedStorefrontShared(),
    };

    setSteps(buildOnboardingSteps(snapshot));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const progress = onboardingProgress(steps);
  const complete = isOnboardingComplete(steps);

  return { loading, steps, progress, complete, shopSlug, refresh };
}

function emptySnapshot(): OnboardingSnapshot {
  return { shop: null, productCount: 0, orderCount: 0, sharedStorefront: false };
}
