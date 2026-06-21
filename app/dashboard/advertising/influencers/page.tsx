"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import {
  aggregateInfluencers,
  STATUS_CLS,
  fmtPct,
  fmtRoi,
  fmtCostPerOrder,
  type InfluencerStats,
} from "@/lib/influencer-stats";
import type { CampaignLink, CampaignVisit, Order } from "@/lib/types";

export default function InfluencersPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<InfluencerStats[]>([]);

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

    const [{ data: links }, { data: visits }, { data: orders }] = await Promise.all([
      supabase.from("campaign_links").select("*").eq("shop_id", shop.id),
      supabase.from("campaign_visits").select("*").eq("shop_id", shop.id),
      supabase.from("orders").select("id, total, campaign_link_id, ref_code, status").eq("shop_id", shop.id),
    ]);

    setStats(
      aggregateInfluencers(
        (links ?? []) as CampaignLink[],
        (visits ?? []) as CampaignVisit[],
        (orders ?? []) as Order[]
      )
    );
    setLoading(false);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="min-w-0 p-4 sm:p-6 md:p-10">
      <Link
        href="/dashboard/advertising"
        className="mb-5 inline-flex min-h-[44px] items-center gap-2 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft size={16} /> Retour à Publicité
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <Trophy size={22} className="text-violet-400" />
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Influenceurs</h1>
      </div>
      <p className="mb-6 text-sm text-white/50">
        Classement par performance — ROI, conversion et coût par commande.
      </p>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {stats.length === 0 ? (
        <div className="rounded-2xl border border-white/10 py-16 text-center text-white/50">
          Aucun influenceur. Ajoute un nom d&apos;influenceur lors de la création d&apos;un lien tracké.
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((inf, rank) => (
            <div
              key={inf.name}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-lg font-bold text-violet-300">
                    {rank + 1}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">{inf.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[inf.status]}`}>
                        {inf.status}
                      </span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < inf.rating ? "text-amber-400" : "text-white/15"}>
                            ★
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold">{formatPrice(inf.revenue)}</p>
                  <p className="text-xs text-white/40">CA généré</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <Metric label="Liens" value={String(inf.links.length)} />
                <Metric label="Visites" value={String(inf.visits)} />
                <Metric label="Commandes" value={String(inf.orders)} />
                <Metric label="Conversion" value={fmtPct(inf.conversionRate)} />
                <Metric label="Coût total" value={formatPrice(inf.totalCost)} />
                <Metric label="ROI" value={fmtRoi(inf.roi)} highlight={inf.roi !== null && inf.roi > 0} />
                <Metric label="Coût/cmd" value={fmtCostPerOrder(inf.costPerOrder)} />
              </div>

              {(inf.promoCodes.length > 0 || inf.links.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/40">
                  {inf.links.map((l) => (
                    <span key={l.id} className="rounded-lg bg-white/5 px-2 py-1 font-mono">
                      ref={l.ref_code}
                    </span>
                  ))}
                  {inf.promoCodes.map((p) => (
                    <span key={p} className="rounded-lg bg-violet-500/10 px-2 py-1 text-violet-300">
                      promo {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/40">
        <TrendingUp size={14} />
        Conversion = commandes ÷ visites · ROI = (CA − coût) ÷ coût · Coût/cmd = coût ÷ commandes
      </div>
    </div>
  );
}

function Metric({
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
