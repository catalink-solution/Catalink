// Stock level helpers (Module 3).
// A product only enforces stock when `track_stock` is true. Otherwise it stays
// always available (backward compatible with products created before V2).

export type StockLevel = "in_stock" | "low" | "out";

export const LOW_STOCK_THRESHOLD = 3;

export function stockLevel(total: number): StockLevel {
  if (total <= 0) return "out";
  if (total <= LOW_STOCK_THRESHOLD) return "low";
  return "in_stock";
}

export const STOCK_META: Record<StockLevel, { label: string; cls: string }> = {
  in_stock: { label: "En stock", cls: "bg-green-500/15 text-green-300" },
  low: { label: "Stock faible", cls: "bg-amber-500/15 text-amber-300" },
  out: { label: "Rupture", cls: "bg-red-500/15 text-red-300" },
};

export function totalStock(variants: { stock: number }[]): number {
  return variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

/** Key used for products without sizes (single global stock entry). */
export const SINGLE_SIZE = "Taille unique";
