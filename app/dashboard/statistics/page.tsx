"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, ShoppingBag, Wallet, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { normalizeStatus } from "@/lib/order-status";

type ItemRow = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
};
type OrderRow = {
  id: string;
  status: string | null;
  total: number;
  created_at: string | null;
  items: ItemRow[];
};

const PERIODS = [
  { key: "7", label: "7 j" },
  { key: "30", label: "30 j" },
  { key: "90", label: "90 j" },
  { key: "all", label: "Tout" },
] as const;

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [catByProduct, setCatByProduct] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("30");

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

    const [{ data: ords }, { data: prods }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, total, created_at, order_items(product_id, product_name, quantity, unit_price)")
        .eq("shop_id", shop.id),
      supabase
        .from("products")
        .select("id, product_main_category")
        .eq("shop_id", shop.id),
    ]);

    const orderRows: OrderRow[] = ((ords ?? []) as Array<
      Omit<OrderRow, "items"> & { order_items: ItemRow[] }
    >).map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
      items: o.order_items ?? [],
    }));
    const map: Record<string, string> = {};
    for (const p of (prods ?? []) as Array<{ id: string; product_main_category: string | null }>) {
      map[p.id] = p.product_main_category ?? "Autres";
    }

    setOrders(orderRows);
    setCatByProduct(map);
    setLoading(false);
  }

  const fromDate = useMemo(() => {
    if (period === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - Number(period));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [period]);

  const inRange = useMemo(() => {
    return orders.filter((o) => {
      if (!fromDate || !o.created_at) return fromDate ? false : true;
      return new Date(o.created_at) >= fromDate;
    });
  }, [orders, fromDate]);

  const stats = useMemo(() => {
    const active = inRange.filter((o) => normalizeStatus(o.status) !== "cancelled");
    const revenue = active.reduce((s, o) => s + Number(o.total || 0), 0);
    const count = active.length;
    const delivered = inRange.filter((o) => normalizeStatus(o.status) === "delivered").length;
    const avg = count > 0 ? revenue / count : 0;
    const deliveryRate = count > 0 ? Math.round((delivered / count) * 100) : 0;
    return { revenue, count, avg, deliveryRate, delivered };
  }, [inRange]);

  const chartData = useMemo(() => {
    const days = period === "all" ? 90 : Number(period);
    const buckets: { label: string; revenue: number; orders: number }[] = [];
    const idx: Record<string, number> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      idx[key] = buckets.length;
      buckets.push({
        label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        revenue: 0,
        orders: 0,
      });
    }
    for (const o of inRange) {
      if (!o.created_at || normalizeStatus(o.status) === "cancelled") continue;
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      const i = idx[key];
      if (i === undefined) continue;
      buckets[i].revenue += Number(o.total || 0);
      buckets[i].orders += 1;
    }
    return buckets;
  }, [inRange, period]);

  const itemsInRange = useMemo(() => {
    return inRange
      .filter((o) => normalizeStatus(o.status) !== "cancelled")
      .flatMap((o) => o.items);
  }, [inRange]);

  const topProducts = useMemo(() => {
    const agg: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const it of itemsInRange) {
      const key = it.product_id ?? it.product_name;
      if (!agg[key]) agg[key] = { name: it.product_name, qty: 0, revenue: 0 };
      agg[key].qty += it.quantity;
      agg[key].revenue += it.quantity * Number(it.unit_price || 0);
    }
    return Object.values(agg)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [itemsInRange]);

  const topCategories = useMemo(() => {
    const agg: Record<string, number> = {};
    for (const it of itemsInRange) {
      const cat = (it.product_id && catByProduct[it.product_id]) || "Autres";
      agg[cat] = (agg[cat] ?? 0) + it.quantity;
    }
    return Object.entries(agg)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [itemsInRange, catByProduct]);

  const maxCatQty = Math.max(1, ...topCategories.map((c) => c.qty));

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Statistiques</h1>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.key
                  ? "bg-violet-600 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Wallet size={18} />} label="Chiffre d'affaires" value={formatPrice(stats.revenue)} />
        <Kpi icon={<ShoppingBag size={18} />} label="Commandes" value={String(stats.count)} />
        <Kpi icon={<TrendingUp size={18} />} label="Panier moyen" value={formatPrice(stats.avg)} />
        <Kpi
          icon={<Truck size={18} />}
          label="Taux de livraison"
          value={`${stats.deliveryRate}%`}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="mb-4 font-bold">Chiffre d'affaires par jour</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} width={50} />
              <Tooltip
                contentStyle={{
                  background: "#0a0e1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(v) => [formatPrice(Number(v ?? 0)), "CA"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#rev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="mb-4 font-bold">Top produits</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-white/40">Aucune vente sur la période.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-xs font-bold text-violet-300">
                      {i + 1}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="whitespace-nowrap text-white/50">
                    {p.qty} vendu(s) · {formatPrice(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="mb-4 font-bold">Top catégories</h2>
          {topCategories.length === 0 ? (
            <p className="text-sm text-white/40">Aucune vente sur la période.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((c, i) => (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="text-white/50">{c.qty}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                      style={{ width: `${(c.qty / maxCatQty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm text-white/40 hover:text-white">
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

function Kpi({
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
      <div className="flex items-center gap-2 text-white/50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
          {icon}
        </span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
