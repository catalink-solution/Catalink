"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Zap,
  LayoutDashboard,
  Store,
  Package,
  ClipboardList,
  Users,
  BarChart3,
  ShoppingCart,
  Megaphone,
  Star,
  Sparkles,
  LogOut,
  ExternalLink,
  MessageSquare,
  Crown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const links = [
  { href: "/dashboard/hub", label: "Hub Social", icon: Zap },
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/shop", label: "Ma boutique", icon: Store },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/orders", label: "Commandes", icon: ClipboardList },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/vip", label: "VIP", icon: Crown },
  { href: "/dashboard/quick-replies", label: "Réponses rapides", icon: MessageSquare },
  { href: "/dashboard/abandoned-carts", label: "Paniers aband.", icon: ShoppingCart },
  { href: "/dashboard/advertising", label: "Publicité", icon: Megaphone },
  { href: "/dashboard/reviews", label: "Avis", icon: Star },
  { href: "/dashboard/stories", label: "Stories", icon: Sparkles },
  { href: "/dashboard/statistics", label: "Statistiques", icon: BarChart3 },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("shops")
        .select("slug")
        .eq("user_id", user.id)
        .maybeSingle();
      setSlug(data?.slug ?? null);
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex shrink-0 flex-col gap-1 border-b border-white/[0.06] bg-[#06080f] p-3 md:h-screen md:w-64 md:border-b-0 md:border-r md:p-5">
      <div className="mb-2 flex items-center justify-between gap-2 px-1 md:px-2">
        <Link href="/dashboard" className="hidden md:block">
          <span className="text-xl font-extrabold tracking-tight">Catalink</span>
        </Link>
        <NotificationBell />
      </div>

      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {links.map((l) => {
          const active =
            l.href === "/dashboard"
              ? pathname === "/dashboard"
              : l.href === "/dashboard/hub"
                ? pathname === "/dashboard/hub"
                : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex min-h-[44px] items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-600/20 text-violet-200"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden flex-col gap-2 border-t border-white/[0.06] pt-4 md:flex">
        {slug && (
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={16} /> Voir ma boutique
          </a>
        )}
        <p className="truncate px-3 text-xs text-white/30">{email}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </div>

      <button
        onClick={logout}
        className="ml-1 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 md:hidden"
      >
        <LogOut size={17} />
      </button>
    </aside>
  );
}
