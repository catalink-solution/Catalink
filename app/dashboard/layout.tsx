"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PwaInstallPrompt } from "@/components/dashboard/pwa-install-prompt";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      if (!session) {
        setReady(false);
        router.replace("/login");
        return;
      }

      const { data: shop } = await supabase
        .from("shops")
        .select("is_suspended")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (shop && (shop as { is_suspended?: boolean }).is_suspended) {
        router.replace("/suspended");
        return;
      }

      setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] text-white/60">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#030712] text-white md:flex-row">
      <DashboardNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <PwaInstallPrompt />
        {children}
      </div>
    </div>
  );
}
