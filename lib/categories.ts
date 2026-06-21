// Main (built-in) product categories + the sizes available for each.
// Custom per-shop categories live in the `product_categories` table and are
// handled separately.

export const MAIN_CATEGORIES = [
  "Vêtements",
  "Chaussures",
  "Chapeaux",
  "Bijoux",
  "Montres",
  "Sacs",
  "Valises",
  "Parfums",
  "Autres",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const SIZES_BY_MAIN: Record<string, string[]> = {
  Vêtements: ["XS", "S", "M", "L", "XL", "XXL"],
  Chaussures: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  Chapeaux: ["Taille unique", "S", "M", "L"],
  Bijoux: ["Taille unique"],
  Montres: ["Taille unique"],
  Sacs: ["Taille unique"],
  Valises: ["Taille unique"],
  Parfums: ["Taille unique"],
  Autres: ["Taille unique"],
};

export function sizesForMain(main: string | null | undefined): string[] {
  if (!main) return [];
  return SIZES_BY_MAIN[main] ?? [];
}
