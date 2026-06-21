// Subscription plans + per-plan limits.
//
// There is no full subscription system yet. `shops.plan` exists (default
// "free") and is read here, but any missing/unknown value safely falls back to
// "free" so the app never blocks on an incomplete billing setup.

export type Plan = "free" | "pro" | "business";

export const PLAN_CATEGORY_LIMITS: Record<Plan, number> = {
  free: 3,
  pro: 20,
  business: Infinity,
};

export function resolvePlan(plan: string | null | undefined): Plan {
  return plan === "pro" || plan === "business" ? plan : "free";
}

export function categoryLimit(plan: string | null | undefined): number {
  return PLAN_CATEGORY_LIMITS[resolvePlan(plan)];
}

export function planLabel(plan: string | null | undefined): string {
  return { free: "Free", pro: "Pro", business: "Business" }[resolvePlan(plan)];
}

/** True when the shop can still create at least one more category. */
export function canCreateCategory(
  plan: string | null | undefined,
  currentCount: number
): boolean {
  return currentCount < categoryLimit(plan);
}
