"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Copy,
  ExternalLink,
  TrendingUp,
  Eye,
  ShoppingBag,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/format";
import type { CampaignLink, CampaignVisit, Order } from "@/lib/types";

type LinkStats = CampaignLink & {
  visits: number;
  orders: number;
  revenue: number;
  roi: number | null;
  rating: number;
};

function slugifyRef(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

function influencerRating(roi: number | null, orders: number): number {
  if (orders === 0) return 0;
  if (roi === null) return orders >= 3 ? 3 : 2;
  if (roi >= 200) return 5;
  if (roi >= 100) return 4;
  if (roi >= 0) return 3;
  return 1;
}

export default function AdvertisingPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<LinkStats[]>([]);
  const [shopSlug, setShopSlug] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [influencer, setInfluencer] = useState("");
  const [refCode, setRefCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [cost, setCost] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

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

    const [{ data: linkRows }, { data: visits }, { data: orders }] = await Promise.all([
      supabase
        .from("campaign_links")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false }),
      supabase.from("campaign_visits").select("*").eq("shop_id", shop.id),
      supabase
        .from("orders")
        .select("id, total, campaign_link_id, ref_code, status")
        .eq("shop_id", shop.id),
    ]);

    const visitList = (visits ?? []) as CampaignVisit[];
    const orderList = (orders ?? []) as Order[];

    const stats: LinkStats[] = ((linkRows ?? []) as CampaignLink[]).map((link) => {
      const v = visitList.filter((x) => x.campaign_link_id === link.id).length;
      const related = orderList.filter(
        (o) =>
          o.campaign_link_id === link.id ||
          (o.ref_code && o.ref_code.toLowerCase() === link.ref_code.toLowerCase())
      );
      const active = related.filter((o) => o.status !== "cancelled");
      const revenue = active.reduce((s, o) => s + Number(o.total || 0), 0);
      const costNum = Number(link.collaboration_cost || 0);
      const roi = costNum > 0 ? Math.round(((revenue - costNum) / costNum) * 100) : null;
      return {
        ...link,
        visits: v,
        orders: active.length,
        revenue,
        roi,
        rating: influencerRating(roi, active.length),
      };
    });

    setLinks(stats);
    setLoading(false);
  }

  const totals = useMemo(
    () => ({
      visits: links.reduce((s, l) => s + l.visits, 0),
      orders: links.reduce((s, l) => s + l.orders, 0),
      revenue: links.reduce((s, l) => s + l.revenue, 0),
    }),
    [links]
  );

  function trackedUrl(ref: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${shopSlug}?ref=${ref}`;
  }

  async function createLink() {
    if (!name.trim()) return setMessage("Indique un nom pour la campagne.");
    if (!refCode.trim()) return setMessage("Indique un code de tracking (ref).");

    setSaving(true);
    setMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    const { error } = await supabase.from("campaign_links").insert({
      shop_id: shop!.id,
      name: name.trim(),
      influencer_name: influencer.trim() || null,
      ref_code: refCode.trim(),
      promo_code: promoCode.trim() || null,
      collaboration_cost: cost ? parseFloat(cost) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: true,
    });

    setSaving(false);
    if (error) {
      setMessage(error.message.includes("unique") ? "Ce code ref existe déjà." : error.message);
      return;
    }
    setShowForm(false);
    setName("");
    setInfluencer("");
    setRefCode("");
    setPromoCode("");
    setCost("");
    setStartDate("");
    setEndDate("");
    load();
  }

  async function toggleActive(link: LinkStats) {
    await supabase
      .from("campaign_links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id);
    load();
  }

  function copyUrl(ref: string) {
    navigator.clipboard.writeText(trackedUrl(ref));
    setMessage("Lien copié !");
    setTimeout(() => setMessage(""), 2000);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Publicité</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/advertising/influencers"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5"
          >
            <TrendingUp size={16} /> Classement influenceurs
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Plus size={16} /> Nouveau lien tracké
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <MiniStat icon={<Eye size={16} />} label="Visites" value={String(totals.visits)} />
        <MiniStat icon={<ShoppingBag size={16} />} label="Commandes" value={String(totals.orders)} />
        <MiniStat icon={<TrendingUp size={16} />} label="CA généré" value={formatPrice(totals.revenue)} />
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Créer un lien tracké</h2>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom de la campagne *" value={name} onChange={setName} placeholder="Story Snapchat Mars" />
            <Field label="Influenceur" value={influencer} onChange={setInfluencer} placeholder="@pseudo" />
            <Field
              label="Code ref (URL) *"
              value={refCode}
              onChange={setRefCode}
              placeholder="snap-mars"
              hint={name && !refCode ? `Suggestion : ${slugifyRef(name)}` : undefined}
            />
            <Field label="Code promo (optionnel)" value={promoCode} onChange={setPromoCode} placeholder="PROMO10" />
            <Field label="Coût collaboration (€)" value={cost} onChange={setCost} type="number" placeholder="50" />
            <Field label="Date début" value={startDate} onChange={setStartDate} type="date" />
            <Field label="Date fin" value={endDate} onChange={setEndDate} type="date" />
          </div>
          {name && !refCode && (
            <button
              type="button"
              onClick={() => setRefCode(slugifyRef(name))}
              className="mt-2 text-xs text-violet-300 hover:text-violet-200"
            >
              Utiliser « {slugifyRef(name)} » comme code ref
            </button>
          )}
          <button
            onClick={createLink}
            disabled={saving}
            className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? "Création…" : "Créer le lien"}
          </button>
        </div>
      )}

      {links.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 py-16 text-center">
          <Megaphone size={40} className="text-white/20" />
          <p className="mt-4 text-white/50">
            Crée ton premier lien tracké pour mesurer tes campagnes influenceurs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((l) => (
            <div key={l.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{l.name}</h3>
                    {!l.is_active && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                        Inactif
                      </span>
                    )}
                  </div>
                  {l.influencer_name && (
                    <p className="mt-0.5 text-sm text-white/50">{l.influencer_name}</p>
                  )}
                  <p className="mt-1 font-mono text-xs text-violet-300">ref={l.ref_code}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < l.rating ? "text-amber-400" : "text-white/15"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="Visites" value={String(l.visits)} />
                <Stat label="Commandes" value={String(l.orders)} />
                <Stat label="CA" value={formatPrice(l.revenue)} />
                <Stat label="Coût" value={formatPrice(l.collaboration_cost ?? 0)} />
                <Stat
                  label="ROI"
                  value={l.roi !== null ? `${l.roi}%` : "—"}
                  highlight={l.roi !== null && l.roi > 0}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => copyUrl(l.ref_code)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                >
                  <Copy size={13} /> Copier le lien
                </button>
                <a
                  href={trackedUrl(l.ref_code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                >
                  <ExternalLink size={13} /> Ouvrir
                </a>
                <button
                  onClick={() => toggleActive(l)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                >
                  {l.is_active ? "Désactiver" : "Activer"}
                </button>
              </div>

              {(l.start_date || l.end_date) && (
                <p className="mt-2 text-xs text-white/30">
                  {l.start_date && formatDate(l.start_date)}
                  {l.start_date && l.end_date && " → "}
                  {l.end_date && formatDate(l.end_date)}
                </p>
              )}
            </div>
          ))}
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

function MiniStat({
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
        <span className="text-violet-300">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${highlight ? "text-green-400" : ""}`}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
      />
      {hint && <span className="mt-0.5 block text-[11px] text-white/30">{hint}</span>}
    </label>
  );
}
