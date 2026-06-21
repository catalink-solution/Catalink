"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Package,
  ClipboardList,
  Truck,
  Users,
  ShoppingCart,
  Megaphone,
  AlertTriangle,
  TrendingUp,
  Plus,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { normalizeStatus } from "@/lib/order-status";
import { totalStock } from "@/lib/stock";
import { PwaInstallCard } from "@/components/dashboard/pwa-install-prompt";
import type { ProductVariant } from "@/lib/types";

type HubStats = {
  ordersToday: number;
  ordersToProcess: number;
  ordersNoTracking: number;
  abandonedCarts: number;
  activeCampaigns: number;
  outOfStockCount: number;
  topClients: Array<{ name: string | null; total_spent: number; orders_count: number }>;
  topProducts: Array<{ name: string; qty: number }>;
};

const EMPTY: HubStats = {
  ordersToday: 0,
  ordersToProcess: 0,
  ordersNoTracking: 0,
  abandonedCarts: 0,
  activeCampaigns: 0,
  outOfStockCount: 0,
  topClients: [],
  topProducts: [],
};

export default function HubSocialPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<HubStats>(EMPTY);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Tu dois être connecté.");
      setLoading(false);
      return;
    }

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) {
      setMessage("Crée d'abord ta boutique.");
      setLoading(false);
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      { data: orders },
      { data: carts },
      { data: campaigns },
      { data: products },
      { data: variants },
      { data: clients },
      { data: orderRows },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, tracking_number, created_at")
        .eq("shop_id", shop.id),
      supabase
        .from("abandoned_carts")
        .select("id")
        .eq("shop_id", shop.id)
        .eq("status", "active"),
      supabase
        .from("campaign_links")
        .select("id")
        .eq("shop_id", shop.id)
        .eq("is_active", true),
      supabase
        .from("products")
        .select("id, name, track_stock, is_active")
        .eq("shop_id", shop.id)
        .eq("is_active", true),
      supabase.from("product_variants").select("product_id, stock"),
      supabase
        .from("customers")
        .select("name, total_spent, orders_count")
        .eq("shop_id", shop.id)
        .order("total_spent", { ascending: false })
        .limit(5),
      supabase
        .from("orders")
        .select("order_items(product_name, quantity)")
        .eq("shop_id", shop.id),
    ]);

    const orderList = orders ?? [];
    const ordersToday = orderList.filter(
      (o) => o.created_at && new Date(o.created_at) >= startOfDay
    ).length;

    const toProcess = orderList.filter((o) => {
      const s = normalizeStatus(o.status);
      return s === "new" || s === "supplying" || s === "received";
    }).length;

    const noTracking = orderList.filter((o) => {
      const s = normalizeStatus(o.status);
      return (s === "received" || s === "supplying") && !o.tracking_number?.trim();
    }).length;

    const variantMap: Record<string, ProductVariant[]> = {};
    for (const v of (variants ?? []) as ProductVariant[]) {
      (variantMap[v.product_id] ??= []).push(v);
    }

    let outOfStock = 0;
    for (const p of products ?? []) {
      if (!p.track_stock) continue;
      const vs = variantMap[p.id] ?? [];
      if (vs.length === 0 || totalStock(vs) <= 0) outOfStock++;
    }

    const productAgg: Record<string, { name: string; qty: number }> = {};
    for (const o of orderRows ?? []) {
      for (const it of (o as { order_items: Array<{ product_name: string; quantity: number }> })
        .order_items ?? []) {
        const key = it.product_name;
        if (!productAgg[key]) productAgg[key] = { name: key, qty: 0 };
        productAgg[key].qty += it.quantity;
      }
    }
    const topProducts = Object.values(productAgg)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    setStats({
      ordersToday,
      ordersToProcess: toProcess,
      ordersNoTracking: noTracking,
      abandonedCarts: (carts ?? []).length,
      activeCampaigns: (campaigns ?? []).length,
      outOfStockCount: outOfStock,
      topClients: (clients ?? []) as HubStats["topClients"],
      topProducts,
    });
    setLoading(false);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="min-w-0 p-4 sm:p-6 md:p-10">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Zap size={22} className="text-violet-400" />
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Hub Social</h1>
        </div>
        <p className="mt-1 text-sm text-white/50">
          Ton centre de commande pour vendre sur Snapchat, TikTok et Telegram.
        </p>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      <div className="mb-6">
        <PwaInstallCard />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi icon={<ClipboardList size={16} />} label="Commandes du jour" value={stats.ordersToday} href="/dashboard/orders" />
        <Kpi icon={<Package size={16} />} label="À traiter" value={stats.ordersToProcess} href="/dashboard/orders" highlight={stats.ordersToProcess > 0} />
        <Kpi icon={<Truck size={16} />} label="Sans tracking" value={stats.ordersNoTracking} href="/dashboard/orders" highlight={stats.ordersNoTracking > 0} />
        <Kpi icon={<ShoppingCart size={16} />} label="Paniers aband." value={stats.abandonedCarts} href="/dashboard/abandoned-carts" />
        <Kpi icon={<Megaphone size={16} />} label="Campagnes actives" value={stats.activeCampaigns} href="/dashboard/advertising" />
        <Kpi icon={<AlertTriangle size={16} />} label="Ruptures stock" value={stats.outOfStockCount} href="/dashboard/products" highlight={stats.outOfStockCount > 0} />
      </div>

      {/* Quick actions */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-white/40">
        Actions rapides
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <QuickAction href="/dashboard/products" icon={<Plus size={18} />} label="Ajouter produit" />
        <QuickAction href="/dashboard/stories" icon={<Sparkles size={18} />} label="Générer story" />
        <QuickAction href="/dashboard/orders" icon={<ClipboardList size={18} />} label="Commandes" />
        <QuickAction href="/dashboard/advertising" icon={<Megaphone size={18} />} label="Publicité" />
        <QuickAction href="/dashboard/clients" icon={<Users size={18} />} label="Clients" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Top clients */}
        <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Meilleurs clients</h2>
            <Link href="/dashboard/clients" className="text-xs text-violet-300 hover:text-violet-200">
              Voir tout →
            </Link>
          </div>
          {stats.topClients.length === 0 ? (
            <p className="text-sm text-white/40">Aucun client pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {stats.topClients.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium">{c.name || "Client"}</span>
                  <span className="shrink-0 text-white/50">
                    {formatPrice(c.total_spent)} · {c.orders_count} cmd
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top products */}
        <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-400" />
            <h2 className="font-bold">Produits les plus vendus</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-white/40">Pas encore de ventes enregistrées.</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-xs font-bold text-violet-300">
                      {i + 1}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-white/50">{p.qty} vendu(s)</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block min-h-[44px] rounded-2xl border p-4 transition-colors hover:bg-white/5 ${
        highlight ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-2 text-white/50">
        <span className="text-violet-300">{icon}</span>
        <span className="text-[11px] leading-tight">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs font-medium text-white/70 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-white"
    >
      <span className="text-violet-300">{icon}</span>
      {label}
    </Link>
  );
}
