import type { CampaignLink, CampaignVisit, Order } from "@/lib/types";

export type InfluencerStatus = "Excellent" | "Rentable" | "Moyen" | "Non rentable";

export type InfluencerStats = {
  name: string;
  links: CampaignLink[];
  promoCodes: string[];
  totalCost: number;
  visits: number;
  orders: number;
  revenue: number;
  conversionRate: number | null;
  roi: number | null;
  costPerOrder: number | null;
  status: InfluencerStatus;
  rating: number;
};

function safeDiv(num: number, den: number): number | null {
  if (den === 0) return null;
  return num / den;
}

export function influencerStatus(roi: number | null, orders: number, visits: number): InfluencerStatus {
  if (orders === 0 && visits > 10) return "Non rentable";
  if (roi === null) {
    if (orders >= 5) return "Rentable";
    if (orders > 0) return "Moyen";
    return "Moyen";
  }
  if (roi >= 150) return "Excellent";
  if (roi >= 0) return "Rentable";
  if (roi >= -50 || orders >= 2) return "Moyen";
  return "Non rentable";
}

export function statusStars(status: InfluencerStatus): number {
  switch (status) {
    case "Excellent":
      return 5;
    case "Rentable":
      return 4;
    case "Moyen":
      return 2;
    case "Non rentable":
      return 1;
  }
}

export const STATUS_CLS: Record<InfluencerStatus, string> = {
  Excellent: "bg-green-500/15 text-green-300",
  Rentable: "bg-blue-500/15 text-blue-300",
  Moyen: "bg-amber-500/15 text-amber-300",
  "Non rentable": "bg-red-500/15 text-red-300",
};

export function aggregateInfluencers(
  links: CampaignLink[],
  visits: CampaignVisit[],
  orders: Order[]
): InfluencerStats[] {
  const byName = new Map<string, CampaignLink[]>();
  for (const l of links) {
    const name = (l.influencer_name || "Sans influenceur").trim();
    const arr = byName.get(name) ?? [];
    arr.push(l);
    byName.set(name, arr);
  }

  const results: InfluencerStats[] = [];

  for (const [name, linkGroup] of byName) {
    const linkIds = new Set(linkGroup.map((l) => l.id));
    const refCodes = new Set(linkGroup.map((l) => l.ref_code.toLowerCase()));

    const infVisits = visits.filter((v) => v.campaign_link_id && linkIds.has(v.campaign_link_id)).length;

    const related = orders.filter(
      (o) =>
        o.status !== "cancelled" &&
        (o.campaign_link_id
          ? linkIds.has(o.campaign_link_id)
          : o.ref_code && refCodes.has(o.ref_code.toLowerCase()))
    );

    const revenue = related.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalCost = linkGroup.reduce((s, l) => s + Number(l.collaboration_cost || 0), 0);
    const orderCount = related.length;

    const conversionRate = safeDiv(orderCount, infVisits);
    const roi =
      totalCost > 0 ? safeDiv(revenue - totalCost, totalCost)! * 100 : null;
    const costPerOrder = safeDiv(totalCost, orderCount);

    const status = influencerStatus(roi, orderCount, infVisits);
    const promos = [...new Set(linkGroup.map((l) => l.promo_code).filter(Boolean))] as string[];

    results.push({
      name,
      links: linkGroup,
      promoCodes: promos,
      totalCost,
      visits: infVisits,
      orders: orderCount,
      revenue,
      conversionRate: conversionRate !== null ? Math.round(conversionRate * 1000) / 10 : null,
      roi: roi !== null ? Math.round(roi) : null,
      costPerOrder,
      status,
      rating: statusStars(status),
    });
  }

  return results.sort((a, b) => b.revenue - a.revenue);
}

export function fmtPct(v: number | null): string {
  if (v === null) return "N/A";
  return `${v}%`;
}

export function fmtRoi(v: number | null): string {
  if (v === null) return "N/A";
  return `${v}%`;
}

export function fmtCostPerOrder(v: number | null): string {
  if (v === null) return "N/A";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
}
