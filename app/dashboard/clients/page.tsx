"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Phone, Mail, ArrowLeft, ShoppingBag, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/format";
import { statusMeta } from "@/lib/order-status";
import { TIER_META, type CustomerLoyalty, type LoyaltyTier } from "@/lib/loyalty";
import type { Customer, Order, OrderItem } from "@/lib/types";

type OrderWithItems = Order & { order_items: OrderItem[] };
type CustomerWithLoyalty = Customer & {
  customer_loyalty?: CustomerLoyalty[] | CustomerLoyalty | null;
};

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [customers, setCustomers] = useState<CustomerWithLoyalty[]>([]);
  const [selected, setSelected] = useState<CustomerWithLoyalty | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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
    const { data } = await supabase
      .from("customers")
      .select("*, customer_loyalty(*)")
      .eq("shop_id", shop.id)
      .order("last_order_at", { ascending: false, nullsFirst: false });
    setCustomers((data ?? []) as CustomerWithLoyalty[]);
    setLoading(false);
  }

  async function openCustomer(c: CustomerWithLoyalty) {
    setSelected(c);
    setOrdersLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as OrderWithItems[]);
    setOrdersLoading(false);
  }

  function loyaltyOf(c: CustomerWithLoyalty): CustomerLoyalty | null {
    const l = c.customer_loyalty;
    if (!l) return null;
    return Array.isArray(l) ? l[0] ?? null : l;
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  // ─── Fiche client détaillée ──────────────────────────────────────────────
  if (selected) {
    const loyalty = loyaltyOf(selected);
    const tier = (loyalty?.tier ?? "Bronze") as LoyaltyTier;
    const tierMeta = TIER_META[tier] ?? TIER_META.Bronze;
    return (
      <div className="p-4 sm:p-6 md:p-10">
        <button
          onClick={() => setSelected(null)}
          className="mb-5 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft size={16} /> Retour aux clients
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {selected.name || "Client sans nom"}
            {selected.is_vip && <Crown size={20} className="ml-2 inline text-yellow-400" />}
          </h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/60">
            {selected.phone && (
              <span className="flex items-center gap-2">
                <Phone size={14} /> {selected.phone}
              </span>
            )}
            {selected.email && (
              <span className="flex items-center gap-2">
                <Mail size={14} /> {selected.email}
              </span>
            )}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Commandes" value={String(selected.orders_count)} />
            <Stat label="Total dépensé" value={formatPrice(selected.total_spent)} />
            <Stat label="Points actuels" value={String(loyalty?.points ?? 0)} />
            <Stat label="Points à vie" value={String(loyalty?.lifetime_points ?? 0)} />
            <Stat label="Niveau" value={tierMeta.label} />
            <Stat label="Dernière" value={formatDate(selected.last_order_at)} />
          </div>
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold">Historique des commandes</h2>
        {ordersLoading ? (
          <p className="text-white/50">Chargement…</p>
        ) : orders.length === 0 ? (
          <p className="text-white/50">Aucune commande.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = statusMeta(o.status);
              return (
                <div
                  key={o.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white/40">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <span className="text-sm text-white/40">{formatDate(o.created_at)}</span>
                    <span className="font-bold">{formatPrice(o.total)}</span>
                  </div>
                  <div className="mt-2 text-sm text-white/50">
                    {o.order_items?.map((it) => (
                      <span key={it.id} className="mr-3">
                        {it.quantity}× {it.product_name}
                        {it.size ? ` (${it.size})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Liste des clients ─────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Clients</h1>
        <Link href="/dashboard/vip" className="text-sm text-violet-300 hover:text-violet-200">
          Clients VIP →
        </Link>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {customers.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 py-16 text-center">
          <Users size={40} className="text-white/20" />
          <p className="mt-4 text-white/50">
            Aucun client pour le moment. Ils apparaîtront dès la première commande.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Contact</th>
                <th className="px-4 py-3 font-medium">Cmd</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Fidélité</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Dernière</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const l = loyaltyOf(c);
                const tier = (l?.tier ?? "Bronze") as LoyaltyTier;
                const tm = TIER_META[tier] ?? TIER_META.Bronze;
                return (
                <tr
                  key={c.id}
                  onClick={() => openCustomer(c)}
                  className="cursor-pointer border-t border-white/[0.06] hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-medium">
                    {c.name || "—"}
                    {c.is_vip && <Crown size={12} className="ml-1 inline text-yellow-400" />}
                  </td>
                  <td className="hidden px-4 py-3 text-white/60 sm:table-cell">
                    {c.phone || c.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-white/70">
                      <ShoppingBag size={13} /> {c.orders_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(c.total_spent)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tm.cls}`}>
                      {tm.label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-white/40 md:table-cell">
                    {formatDate(c.last_order_at)}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm text-white/40 hover:text-white">
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
