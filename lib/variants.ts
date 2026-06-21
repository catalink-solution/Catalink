// Système de variantes V3 — helpers partagés admin + storefront.
//
// Architecture (tables Supabase) :
//   product_attributes        → un attribut (Couleur, Taille, Matière…)
//   product_attribute_values  → ses valeurs (Noir, Blanc, 42…) + hex couleur
//   product_skus              → une combinaison (Noir / 42) : stock, prix override
//   product_sku_values        → liens sku ↔ valeurs d'attribut
//   product_sku_images        → photos par variante
//
// Un produit avec `has_variants = false` ignore tout ceci et reste sur le
// système historique (sizes / product_variants).

import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductSku,
  ProductSkuValue,
} from "@/lib/types";

/** Nom d'attribut traité comme couleur (active la palette + swatches). */
export const COLOR_ATTRIBUTE_NAMES = ["couleur", "color", "coloris"];

export function isColorAttribute(name: string): boolean {
  return COLOR_ATTRIBUTE_NAMES.includes(name.trim().toLowerCase());
}

/** Palette de couleurs natives proposée par défaut dans l'admin. */
export const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Gris", hex: "#9CA3AF" },
  { name: "Rouge", hex: "#EF4444" },
  { name: "Bordeaux", hex: "#7F1D1D" },
  { name: "Orange", hex: "#F97316" },
  { name: "Jaune", hex: "#FACC15" },
  { name: "Vert", hex: "#22C55E" },
  { name: "Vert olive", hex: "#4D7C0F" },
  { name: "Bleu", hex: "#3B82F6" },
  { name: "Bleu marine", hex: "#1E3A8A" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Beige", hex: "#E7D8B0" },
  { name: "Marron", hex: "#92400E" },
  { name: "Or", hex: "#D4AF37" },
  { name: "Argent", hex: "#C0C0C0" },
  { name: "Kaki", hex: "#4B5320" },
];

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex.trim());
}

/** Luminance relative → choisit une bordure visible pour les couleurs claires. */
export function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.8;
}

// ─── Génération des combinaisons (produit cartésien) ────────────────────────

export type DraftAttribute = {
  name: string;
  values: { value: string; hex: string | null }[];
};

export type GeneratedCombo = {
  /** Clé stable = ids/labels des valeurs joints, pour le mapping stock/prix. */
  key: string;
  /** Valeurs ordonnées par attribut, pour l'affichage. */
  parts: { attribute: string; value: string; hex: string | null }[];
  label: string;
};

/**
 * Produit cartésien de toutes les valeurs d'attributs.
 * 3 couleurs × 5 tailles = 15 combinaisons.
 */
export function generateCombos(attributes: DraftAttribute[]): GeneratedCombo[] {
  const valid = attributes
    .map((a) => ({ name: a.name.trim(), values: a.values.filter((v) => v.value.trim()) }))
    .filter((a) => a.name && a.values.length > 0);

  if (valid.length === 0) return [];

  let combos: { attribute: string; value: string; hex: string | null }[][] = [[]];
  for (const attr of valid) {
    const next: typeof combos = [];
    for (const combo of combos) {
      for (const v of attr.values) {
        next.push([...combo, { attribute: attr.name, value: v.value.trim(), hex: v.hex }]);
      }
    }
    combos = next;
  }

  return combos.map((parts) => ({
    key: parts.map((p) => `${p.attribute}=${p.value}`).join(" | "),
    parts,
    label: parts.map((p) => p.value).join(" / "),
  }));
}

// ─── Reconstruction storefront (à partir des données chargées) ──────────────

export type LoadedVariantData = {
  attributes: ProductAttribute[];
  values: ProductAttributeValue[];
  skus: ProductSku[];
  skuValues: ProductSkuValue[];
};

export type ResolvedSku = ProductSku & { valueIds: string[]; label: string };

/** Associe à chaque sku ses ids de valeurs + un libellé lisible. */
export function resolveSkus(data: LoadedVariantData): ResolvedSku[] {
  const valueById = new Map(data.values.map((v) => [v.id, v]));
  const bySku = new Map<string, string[]>();
  for (const sv of data.skuValues) {
    const arr = bySku.get(sv.sku_id) ?? [];
    arr.push(sv.attribute_value_id);
    bySku.set(sv.sku_id, arr);
  }
  return data.skus.map((sku) => {
    const valueIds = bySku.get(sku.id) ?? [];
    const label = valueIds
      .map((id) => valueById.get(id)?.value)
      .filter(Boolean)
      .join(" / ");
    return { ...sku, valueIds, label };
  });
}

/** Trouve le sku correspondant à une sélection complète (valeurs choisies). */
export function findSku(skus: ResolvedSku[], selectedValueIds: string[]): ResolvedSku | null {
  if (selectedValueIds.length === 0) return null;
  const want = [...selectedValueIds].sort().join(",");
  return (
    skus.find((s) => [...s.valueIds].sort().join(",") === want) ?? null
  );
}

/**
 * Valeurs disponibles pour un attribut donné, compte tenu des autres choix.
 * Permet de désactiver une valeur dont aucune combinaison en stock n'existe.
 */
export function availableValueIds(
  skus: ResolvedSku[],
  attributeValueIds: string[],
  otherSelected: string[]
): Set<string> {
  const available = new Set<string>();
  for (const valueId of attributeValueIds) {
    const candidate = [...otherSelected, valueId];
    const match = skus.some((s) => {
      if (!s.active || s.stock_quantity <= 0) return false;
      return candidate.every((id) => s.valueIds.includes(id));
    });
    if (match) available.add(valueId);
  }
  return available;
}
