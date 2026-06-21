"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Phone, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/format";
import type { AbandonedCart } from "@/lib/types";

type CartItem = {
  name?: string;
  quantity?: number;
  size?: string;
  price?: number;
};

function parseItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw as CartItem[];
}

export default function AbandonedCartsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");

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
      .select("id, slug")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) {
      setMessage("Crée d'abord ta boutique.");
      setLoading(false);
      return;
    }
    setShopSlug(shop.slug);

    const { data } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("shop_id", shop.id)
      .order("updated_at", { ascending: false });
    setCarts((data ?? []) as AbandonedCart[]);
    setLoading(false);
  }

  async function markReminded(id: string) {
    await supabase
      .from("abandoned_carts")
      .update({ reminded_at: new Date().toISOString() })
      .eq("id", id);
    setCarts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, reminded_at: new Date().toISOString() } : c
      )
    );
  }

  function relaunch(c: AbandonedCart) {
    const items = parseItems(c.items);
    const lines = items
      .map(
        (i) =>
          `• ${i.quantity ?? 1}× ${i.name ?? "Produit"}${i.size ? ` (${i.size})` : ""}`
      )
      .join("\n");
    const text = encodeURIComponent(
      `Bonjour${c.customer_name ? ` ${c.customer_name}` : ""}, tu as laissé des articles dans ton panier (${formatPrice(c.total)}) :\n\n${lines}\n\nTu veux finaliser ta commande ?${shopSlug ? `\n${window.location.origin}/${shopSlug}` : ""}`
    );
    const phone = c.customer_phone?.replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    } else {
      navigator.clipboard.writeText(decodeURIComponent(text));
      setMessage("Message copié dans le presse-papier (pas de téléphone renseigné).");
      setTimeout(() => setMessage(""), 4000);
    }
    markReminded(c.id);
  }

  const visible = carts.filter((c) => filter === "all" || c.status === "active");

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Paniers abandonnés</h1>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {(["active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === f ? "bg-violet-600 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {f === "active" ? "Actifs" : "Tous"}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 py-16 text-center">
          <ShoppingCart size={40} className="text-white/20" />
          <p className="mt-4 text-white/50">Aucun panier abandonné pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((c) => {
            const items = parseItems(c.items);
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.customer_name || "Visiteur anonyme"}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-white/50">
                      {c.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={13} /> {c.customer_phone}
                        </span>
                      )}
                      {c.customer_email && (
                        <span className="flex items-center gap-1">
                          <Mail size={13} /> {c.customer_email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatPrice(c.total)}</p>
                    <p className="text-xs text-white/40">
                      {formatDate(c.updated_at ?? c.created_at)}
                    </p>
                    {c.status === "recovered" && (
                      <span className="mt-1 inline-block rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-300">
                        Récupéré
                      </span>
                    )}
                    {c.reminded_at && (
                      <p className="mt-1 text-xs text-white/30">
                        Relancé le {formatDate(c.reminded_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm text-white/60">
                  {items.map((it, i) => (
                    <p key={i}>
                      {it.quantity ?? 1}× {it.name ?? "Produit"}
                      {it.size ? ` (${it.size})` : ""}
                      {it.price != null && (
                        <span className="text-white/40"> — {formatPrice(it.price)}</span>
                      )}
                    </p>
                  ))}
                </div>

                {c.status === "active" && (
                  <button
                    onClick={() => relaunch(c)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600/20 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-600/30"
                  >
                    <MessageCircle size={16} /> Relancer le client
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={load}
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
        <Link href="/dashboard" className="text-sm text-white/40 hover:text-white">
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
