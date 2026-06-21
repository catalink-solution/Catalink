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
  Wand2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const links = [
  { href: "/dashboard/hub", label: "Hub Social", icon: Zap },
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/shop", label: "Ma boutique", icon: Store },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/ai-import", label: "AI Import", icon: Wand2 },
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
    <aside className="dashboard-nav flex shrink-0 flex-col gap-1 border-b border-white/[0.06] bg-[#06080f] px-3 pb-2 md:h-screen md:w-64 md:gap-1 md:border-b-0 md:border-r md:px-5 md:pb-5">
      {/* Header mobile : cloche + nom à gauche, déconnexion à droite */}
      <div className="mb-1 flex items-center justify-between gap-2 px-1 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <NotificationBell />
          <Link href="/dashboard" className="min-w-0">
            <span className="block truncate text-lg font-extrabold tracking-tight">Catalink</span>
          </Link>
        </div>
        <button
          onClick={logout}
          aria-label="Déconnexion"
          className="btn-icon-touch shrink-0 rounded-xl text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Header desktop : nom à gauche, cloche à droite */}
      <div className="mb-2 hidden items-center justify-between gap-2 px-2 md:flex">
        <Link href="/dashboard">
          <span className="text-xl font-extrabold tracking-tight">Catalink</span>
        </Link>
        <NotificationBell />
      </div>

      <nav className="dashboard-tabs -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0 md:pb-0">
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
              className={`flex min-h-[56px] items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-3 text-[15px] font-medium transition-colors md:min-h-[44px] md:px-3 md:py-2.5 md:text-sm ${
                active
                  ? "bg-violet-600/20 text-violet-200"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-[22px] w-[22px] shrink-0 md:h-[17px] md:w-[17px]" />
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
    </aside>
  );
}
