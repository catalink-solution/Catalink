"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useCart, type CartItem } from "./cart-context";
import {
  getSessionId,
  getCampaignRef,
  getPromoCode,
  setCampaignRef,
  setPromoCode,
  hasRecordedVisit,
  markVisitRecorded,
} from "@/lib/storefront-session";

function cartPayload(items: CartItem[]) {
  return items.map((i) => ({
    product_id: i.productId,
    name: i.name,
    quantity: i.quantity,
    size: i.size ?? "",
    price: i.price,
    image_url: i.imageUrl,
    sku_id: i.skuId ?? "",
    variant_label: i.variantLabel ?? "",
  }));
}

export function StorefrontTracker({
  shopId,
  slug,
}: {
  shopId: string;
  slug: string;
}) {
  const { items, totalPrice } = useCart();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Campaign ref from URL (?ref=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref")?.trim();
    if (!ref) return;

    setCampaignRef(slug, ref);

    if (hasRecordedVisit(slug, ref)) return;

    const sessionId = getSessionId(slug);
    supabase
      .rpc("record_campaign_visit", {
        p_shop_id: shopId,
        p_ref_code: ref,
        p_session_id: sessionId,
        p_user_agent: navigator.userAgent,
      })
      .then(({ data: linkId }) => {
        if (linkId) {
          markVisitRecorded(slug, ref);
          supabase
            .from("campaign_links")
            .select("promo_code")
            .eq("id", linkId)
            .maybeSingle()
            .then(({ data }) => {
              if (data?.promo_code) setPromoCode(slug, data.promo_code);
            });
        }
      });
  }, [shopId, slug]);

  // Abandoned cart sync (debounced when cart has items)
  useEffect(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);

    if (items.length === 0) return;

    syncTimer.current = setTimeout(() => {
      const sessionId = getSessionId(slug);
      supabase.rpc("upsert_abandoned_cart", {
        p_shop_id: shopId,
        p_session_id: sessionId,
        p_items: cartPayload(items),
        p_total: totalPrice,
      });
    }, 1500);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, totalPrice, shopId, slug]);

  return null;
}

/** Sync checkout contact info into abandoned cart record. */
export function syncAbandonedCartContact(
  shopId: string,
  slug: string,
  items: CartItem[],
  total: number,
  contact: { name?: string; phone?: string; email?: string }
) {
  const sessionId = getSessionId(slug);
  return supabase.rpc("upsert_abandoned_cart", {
    p_shop_id: shopId,
    p_session_id: sessionId,
    p_items: cartPayload(items),
    p_total: total,
    p_name: contact.name || null,
    p_phone: contact.phone || null,
    p_email: contact.email || null,
  });
}

export function getCheckoutAttribution(slug: string) {
  return {
    sessionId: getSessionId(slug),
    refCode: getCampaignRef(slug),
    promoCode: getPromoCode(slug),
  };
}
