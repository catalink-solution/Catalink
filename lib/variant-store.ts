// Chargement / sauvegarde du système de variantes V3 contre Supabase.
// Stratégie de sauvegarde : remplacement complet (delete + re-insert) — simple
// et fiable à l'échelle d'une boutique (nombre de variantes borné).

import { supabase } from "@/lib/supabase";
import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductSku,
  ProductSkuValue,
  ProductSkuImage,
} from "@/lib/types";

export type ComboDraft = {
  key: string;
  label: string;
  parts: { attribute: string; value: string; hex: string | null }[];
  stock: string;
  price: string;
  active: boolean;
  images: string[];
};

export type VariantDraft = {
  enabled: boolean;
  attributes: { name: string; values: { value: string; hex: string | null }[] }[];
  combos: ComboDraft[];
};

export const EMPTY_VARIANT_DRAFT: VariantDraft = {
  enabled: false,
  attributes: [],
  combos: [],
};

/** Construit la clé d'une combinaison à partir de ses parties. */
export function comboKey(parts: { attribute: string; value: string }[]): string {
  return parts.map((p) => `${p.attribute}=${p.value}`).join(" | ");
}

/** Charge l'état variantes d'un produit pour pré-remplir l'éditeur. */
export async function loadProductVariants(productId: string): Promise<VariantDraft> {
  const [{ data: attrs }, { data: vals }, { data: skus }, { data: skuVals }, { data: skuImgs }] =
    await Promise.all([
      supabase.from("product_attributes").select("*").eq("product_id", productId).order("position"),
      supabase.from("product_attribute_values").select("*").order("position"),
      supabase.from("product_skus").select("*").eq("product_id", productId),
      supabase.from("product_sku_values").select("*"),
      supabase.from("product_sku_images").select("*").order("sort_order"),
    ]);

  const attributes = (attrs ?? []) as ProductAttribute[];
  if (attributes.length === 0) return { ...EMPTY_VARIANT_DRAFT };

  const attrIds = new Set(attributes.map((a) => a.id));
  const allValues = ((vals ?? []) as ProductAttributeValue[]).filter((v) => attrIds.has(v.attribute_id));
  const valueById = new Map(allValues.map((v) => [v.id, v]));

  const productSkus = (skus ?? []) as ProductSku[];
  const skuIds = new Set(productSkus.map((s) => s.id));
  const links = ((skuVals ?? []) as ProductSkuValue[]).filter((l) => skuIds.has(l.sku_id));
  const images = ((skuImgs ?? []) as ProductSkuImage[]).filter((i) => skuIds.has(i.sku_id));

  const draftAttributes = attributes.map((a) => ({
    name: a.name,
    values: allValues
      .filter((v) => v.attribute_id === a.id)
      .map((v) => ({ value: v.value, hex: v.hex })),
  }));

  const valuesBySku = new Map<string, string[]>();
  for (const l of links) {
    const arr = valuesBySku.get(l.sku_id) ?? [];
    arr.push(l.attribute_value_id);
    valuesBySku.set(l.sku_id, arr);
  }
  const imagesBySku = new Map<string, string[]>();
  for (const im of images) {
    const arr = imagesBySku.get(im.sku_id) ?? [];
    arr.push(im.image_url);
    imagesBySku.set(im.sku_id, arr);
  }
  // Ordre des attributs pour reconstruire des parts cohérentes.
  const attrOrder = new Map(attributes.map((a, i) => [a.id, i]));

  const combos: ComboDraft[] = productSkus.map((sku) => {
    const valueIds = valuesBySku.get(sku.id) ?? [];
    const parts = valueIds
      .map((id) => valueById.get(id))
      .filter((v): v is ProductAttributeValue => Boolean(v))
      .sort((a, b) => (attrOrder.get(a.attribute_id) ?? 0) - (attrOrder.get(b.attribute_id) ?? 0))
      .map((v) => {
        const attr = attributes.find((a) => a.id === v.attribute_id);
        return { attribute: attr?.name ?? "", value: v.value, hex: v.hex };
      });
    return {
      key: comboKey(parts),
      label: parts.map((p) => p.value).join(" / "),
      parts,
      stock: String(sku.stock_quantity),
      price: sku.price != null ? String(sku.price) : "",
      active: sku.active,
      images: imagesBySku.get(sku.id) ?? [],
    };
  });

  return { enabled: true, attributes: draftAttributes, combos };
}

/**
 * Remplace entièrement les variantes d'un produit.
 * Met aussi à jour products.has_variants.
 */
export async function saveProductVariants(productId: string, draft: VariantDraft): Promise<void> {
  // Reset complet (cascades : attributes→values→sku_values ; skus→sku_values/images)
  await supabase.from("product_skus").delete().eq("product_id", productId);
  await supabase.from("product_attributes").delete().eq("product_id", productId);

  const hasVariants = draft.enabled && draft.attributes.length > 0 && draft.combos.length > 0;

  if (!hasVariants) {
    await supabase.from("products").update({ has_variants: false }).eq("id", productId);
    return;
  }

  // 1) Attributs
  const attrRows = draft.attributes.map((a, i) => ({
    product_id: productId,
    name: a.name.trim(),
    position: i,
  }));
  const { data: insertedAttrs } = await supabase
    .from("product_attributes")
    .insert(attrRows)
    .select("id, name");
  const attrIdByName = new Map((insertedAttrs ?? []).map((a) => [a.name, a.id as string]));

  // 2) Valeurs
  const valueRows: { attribute_id: string; value: string; hex: string | null; position: number }[] = [];
  for (const a of draft.attributes) {
    const attrId = attrIdByName.get(a.name.trim());
    if (!attrId) continue;
    a.values.forEach((v, i) => {
      valueRows.push({ attribute_id: attrId, value: v.value.trim(), hex: v.hex, position: i });
    });
  }
  const { data: insertedValues } = await supabase
    .from("product_attribute_values")
    .insert(valueRows)
    .select("id, attribute_id, value");

  // Map "attrName=value" → value_id
  const valueIdByKey = new Map<string, string>();
  for (const v of insertedValues ?? []) {
    const attrName = [...attrIdByName.entries()].find(([, id]) => id === v.attribute_id)?.[0];
    if (attrName) valueIdByKey.set(`${attrName}=${v.value}`, v.id as string);
  }

  // 3) SKUs (combinaisons)
  const skuRows = draft.combos.map((c) => ({
    product_id: productId,
    stock_quantity: Math.max(0, parseInt(c.stock || "0", 10) || 0),
    price: c.price.trim() === "" ? null : Math.max(0, parseFloat(c.price) || 0),
    active: c.active,
  }));
  const { data: insertedSkus } = await supabase.from("product_skus").insert(skuRows).select("id");
  const skuIds = (insertedSkus ?? []).map((s) => s.id as string);

  // 4) Liens sku ↔ valeurs + images
  const linkRows: { sku_id: string; attribute_value_id: string }[] = [];
  const imageRows: { sku_id: string; image_url: string; sort_order: number }[] = [];
  draft.combos.forEach((c, idx) => {
    const skuId = skuIds[idx];
    if (!skuId) return;
    for (const p of c.parts) {
      const valueId = valueIdByKey.get(`${p.attribute.trim()}=${p.value.trim()}`);
      if (valueId) linkRows.push({ sku_id: skuId, attribute_value_id: valueId });
    }
    c.images.forEach((url, i) => imageRows.push({ sku_id: skuId, image_url: url, sort_order: i }));
  });

  if (linkRows.length > 0) await supabase.from("product_sku_values").insert(linkRows);
  if (imageRows.length > 0) await supabase.from("product_sku_images").insert(imageRows);

  await supabase.from("products").update({ has_variants: true }).eq("id", productId);
}
