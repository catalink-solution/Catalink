"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ClipboardList,
  TrendingUp,
  Store,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import type { Order, Shop } from "@/lib/types";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [stats, setStats] = useState({
    products: 0,
    activeProducts: 0,
    orders: 0,
    newOrders: 0,
    revenue: 0,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: shopRow } = await supabase
      .from("shops")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const shopData = shopRow as Shop | null;
    setShop(shopData);

    if (shopData) {
      const { data: productRows } = await supabase
        .from("products")
        .select("id, is_active")
        .eq("shop_id", shopData.id);

      const { data: orderRows } = await supabase
        .from("orders")
        .select("id, status, total")
        .eq("shop_id", shopData.id);

      const products = (productRows ?? []) as { id: string; is_active: boolean }[];
      const orders = (orderRows ?? []) as Order[];

      setStats({
        products: products.length,
        activeProducts: products.filter((p) => p.is_active).length,
        orders: orders.length,
        newOrders: orders.filter((o) => o.status === "new").length,
        revenue: orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
      });
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Vue d&apos;ensemble</h1>

      {!shop && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-400" size={20} />
          <div>
            <p className="font-semibold text-amber-200">Crée ta boutique</p>
            <p className="mt-1 text-sm text-amber-100/70">
              Tu n&apos;as pas encore de boutique. Configure-la pour commencer à vendre.
            </p>
            <Link
              href="/dashboard/shop"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700"
            >
              Créer ma boutique <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {shop && (
        <>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/40">Ta boutique est en ligne</p>
              <p className="mt-0.5 font-mono text-violet-300">/{shop.slug}</p>
            </div>
            <a
              href={`/${shop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              Voir la boutique publique <ArrowRight size={15} />
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Package size={18} className="text-blue-400" />}
              label="Produits actifs"
              value={`${stats.activeProducts}/${stats.products}`}
            />
            <StatCard
              icon={<ClipboardList size={18} className="text-violet-400" />}
              label="Commandes"
              value={String(stats.orders)}
            />
            <StatCard
              icon={<TrendingUp size={18} className="text-green-400" />}
              label="Nouvelles"
              value={String(stats.newOrders)}
            />
            <StatCard
              icon={<Store size={18} className="text-cyan-400" />}
              label="Chiffre d'affaires"
              value={formatPrice(stats.revenue)}
            />
          </div>
        </>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/dashboard/shop"
          title="Ma boutique"
          desc="Nom, description, lien public et réseaux sociaux."
        />
        <QuickLink
          href="/dashboard/products"
          title="Produits"
          desc="Ajouter, modifier, activer ou supprimer tes produits."
        />
        <QuickLink
          href="/dashboard/orders"
          title="Commandes"
          desc="Suivre et gérer les commandes reçues."
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/40">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          {icon}
        </span>
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/25"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <ArrowRight
          size={18}
          className="text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white"
        />
      </div>
      <p className="mt-2 text-sm text-white/50">{desc}</p>
    </Link>
  );
}
