"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

function parseHashParams(hash: string) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function activateFromUrl() {
      if (!isSupabaseConfigured()) {
        router.replace("/login?error=auth_callback");
        return;
      }

      const supabase = getSupabaseBrowser();
      const url = new URL(window.location.href);

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback] exchangeCodeForSession failed:", error);
          router.replace("/login?error=auth_callback");
          return;
        }
        window.history.replaceState({}, "", "/auth/callback");
        router.replace("/auth/set-password");
        return;
      }

      const hashParams = parseHashParams(window.location.hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error("[auth/callback] setSession failed:", error);
          router.replace("/login?error=auth_callback");
          return;
        }
        window.history.replaceState({}, "", "/auth/callback");
        router.replace("/auth/set-password");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/auth/set-password");
        return;
      }

      router.replace("/login?error=auth_callback");
    }

    void activateFromUrl();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white/60">
      Activation de ton accès…
    </main>
  );
}
