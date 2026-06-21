"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crown, Star, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/format";
import { TIER_META, tierFromLifetimePoints, type CustomerLoyalty, type LoyaltyTier } from "@/lib/loyalty";
import type { Customer } from "@/lib/types";

type CustomerRow = Customer & {
  customer_loyalty: CustomerLoyalty[] | CustomerLoyalty | null;
};

type FilterKey = "all" | "vip" | "Bronze" | "Silver" | "Gold" | "high_orders" | "high_spent";

export default function VipPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [minOrders, setMinOrders] = useState(3);
  const [minSpent, setMinSpent] = useState(200);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

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
      .order("total_spent", { ascending: false });

    setCustomers((data ?? []) as CustomerRow[]);
    setLoading(false);
  }

  function loyaltyOf(c: CustomerRow): CustomerLoyalty | null {
    const l = c.customer_loyalty;
    if (!l) return null;
    return Array.isArray(l) ? l[0] ?? null : l;
  }

  const visible = useMemo(() => {
    return customers.filter((c) => {
      const l = loyaltyOf(c);
      const tier = (l?.tier ?? tierFromLifetimePoints(l?.lifetime_points ?? 0)) as LoyaltyTier;
      if (filter === "vip") return c.is_vip;
      if (filter === "Bronze" || filter === "Silver" || filter === "Gold") return tier === filter;
      if (filter === "high_orders") return c.orders_count >= minOrders;
      if (filter === "high_spent") return Number(c.total_spent) >= minSpent;
      return true;
    });
  }, [customers, filter, minOrders, minSpent]);

  async function toggleVip(c: CustomerRow) {
    await supabase.from("customers").update({ is_vip: !c.is_vip }).eq("id", c.id);
    setCustomers((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, is_vip: !x.is_vip } : x))
    );
  }

  async function saveNote(id: string) {
    await supabase.from("customers").update({ internal_note: noteDraft.trim() || null }).eq("id", id);
    setCustomers((prev) =>
      prev.map((x) => (x.id === id ? { ...x, internal_note: noteDraft.trim() || null } : x))
    );
    setEditingId(null);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="min-w-0 p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex items-center gap-2">
        <Crown size={22} className="text-yellow-400" />
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Clients VIP</h1>
      </div>
      <p className="mb-6 text-sm text-white/50">
        Identifie tes meilleurs clients et prépare des offres privées.
      </p>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "Tous"],
            ["vip", "VIP manuel"],
            ["Gold", "Gold"],
            ["Silver", "Silver"],
            ["Bronze", "Bronze"],
            ["high_orders", `≥ ${minOrders} cmd`],
            ["high_spent", `≥ ${minSpent}€`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`min-h-[40px] rounded-xl px-3 py-1.5 text-sm font-medium ${
              filter === key ? "bg-violet-600 text-white" : "border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(filter === "high_orders" || filter === "high_spent") && (
        <div className="mb-4 flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <label className="text-sm text-white/60">
            Min. commandes
            <input
              type="number"
              min={1}
              value={minOrders}
              onChange={(e) => setMinOrders(Number(e.target.value))}
              className="ml-2 w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white"
            />
          </label>
          <label className="text-sm text-white/60">
            Min. dépensé (€)
            <input
              type="number"
              min={0}
              value={minSpent}
              onChange={(e) => setMinSpent(Number(e.target.value))}
              className="ml-2 w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white"
            />
          </label>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-white/10 py-16 text-center text-white/50">
          Aucun client pour ce filtre.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => {
            const l = loyaltyOf(c);
            const tier = (l?.tier ?? "Bronze") as LoyaltyTier;
            const meta = TIER_META[tier] ?? TIER_META.Bronze;
            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-4 ${
                  c.is_vip ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.name || "Client"}</p>
                      {c.is_vip && <Crown size={14} className="text-yellow-400" />}
                    </div>
                    <p className="text-sm text-white/50">{c.phone || c.email || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.cls}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-white/40">
                        {l?.points ?? 0} pts · {c.orders_count} cmd · {formatPrice(c.total_spent)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleVip(c)}
                      className="min-h-[44px] rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/5"
                    >
                      {c.is_vip ? "Retirer VIP" : "Marquer VIP"}
                    </button>
                    <button
                      disabled
                      title="Bientôt disponible"
                      className="min-h-[44px] cursor-not-allowed rounded-xl border border-white/5 px-3 py-2 text-xs text-white/25"
                    >
                      Offre privée (bientôt)
                    </button>
                  </div>
                </div>

                {editingId === c.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Note interne…"
                      className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={() => saveNote(c.id)}
                      className="min-h-[44px] rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setNoteDraft(c.internal_note ?? "");
                    }}
                    className="mt-3 text-left text-xs text-white/40 hover:text-white/70"
                  >
                    {c.internal_note ? `Note : ${c.internal_note}` : "+ Ajouter une note interne"}
                  </button>
                )}

                {c.last_order_at && (
                  <p className="mt-1 text-[11px] text-white/30">
                    Dernière commande : {formatDate(c.last_order_at)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Link href="/dashboard/clients" className="text-sm text-white/40 hover:text-white">
          ← Voir tous les clients
        </Link>
      </div>
    </div>
  );
}
