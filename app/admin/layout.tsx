"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Shield, LayoutDashboard, LogOut } from "lucide-react";

async function verifyAdminAccess(): Promise<"ok" | "unauthorized" | "forbidden"> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return "unauthorized";

  const res = await fetch("/api/admin/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return "unauthorized";
  if (res.status === 403 || res.status === 503) return "forbidden";
  if (!res.ok) return "forbidden";
  return "ok";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDebugPage = pathname === "/admin/debug";
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isDebugPage) return;

    let cancelled = false;

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session?.user?.email) {
        router.replace("/login?redirect=/admin");
        return;
      }

      const access = await verifyAdminAccess();
      if (cancelled) return;

      if (access === "unauthorized") {
        router.replace("/login?redirect=/admin");
        return;
      }
      if (access === "forbidden") {
        router.replace("/dashboard");
        return;
      }

      setEmail(session.user.email);
      setReady(true);
    }

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, isDebugPage]);

  if (isDebugPage) {
    return <>{children}</>;
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] text-white/60">
        Vérification accès admin…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <header className="border-b border-white/10 bg-[#06080f]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Shield className="text-red-400" size={24} />
            <div>
              <p className="font-extrabold tracking-tight">Admin Catalink</p>
              <p className="text-xs text-white/40">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            >
              <LayoutDashboard size={16} /> Dashboard vendeur
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
