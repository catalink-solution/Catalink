/** Loyalty tier helpers — 1€ dépensé = 1 point (attribué à la livraison). */

export type LoyaltyTier = "Bronze" | "Silver" | "Gold";

export const TIER_THRESHOLDS = {
  Silver: 500,
  Gold: 1500,
} as const;

export function tierFromLifetimePoints(lifetime: number): LoyaltyTier {
  if (lifetime >= TIER_THRESHOLDS.Gold) return "Gold";
  if (lifetime >= TIER_THRESHOLDS.Silver) return "Silver";
  return "Bronze";
}

export const TIER_META: Record<LoyaltyTier, { label: string; cls: string }> = {
  Bronze: { label: "Bronze", cls: "bg-amber-700/20 text-amber-400" },
  Silver: { label: "Silver", cls: "bg-slate-400/20 text-slate-300" },
  Gold: { label: "Gold", cls: "bg-yellow-500/20 text-yellow-300" },
};

export type CustomerLoyalty = {
  id: string;
  shop_id: string;
  customer_id: string;
  points: number;
  lifetime_points: number;
  tier: LoyaltyTier | string;
  updated_at: string | null;
};

/** Appelle la RPC Supabase après passage en « Livrée ». */
export async function awardLoyaltyOnDelivery(
  supabase: { rpc: (fn: string, args: object) => unknown },
  orderId: string
) {
  return supabase.rpc("award_loyalty_on_delivery", { p_order_id: orderId });
}
