// Publication d'un produit détecté → produit réel + variantes V3.
// Côté client (RLS propriétaire). Réutilise le système de variantes V3.

import { supabase } from "@/lib/supabase";
import { generateCombos, type DraftAttribute } from "@/lib/variants";
import { saveProductVariants, type VariantDraft, type ComboDraft } from "@/lib/variant-store";
import type { ImportDetectedProduct, ImportDetectedVariant, ImportFile } from "./types";

const MAX_VARIANT_IMAGES = 4;

export type PublishInput = {
  shopId: string;
  detected: ImportDetectedProduct;
  files: ImportFile[];
  variants: ImportDetectedVariant[];
};

export async function publishDetectedProduct(
  input: PublishInput
): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  const { shopId, detected, files, variants } = input;

  const price = detected.sale_price ?? 0;
  if (!detected.title?.trim()) return { ok: false, error: "Titre manquant." };
  if (!(price > 0)) return { ok: false, error: "Prix de vente requis." };

  const orderedFiles = [...files].sort((a, b) => a.sort_order - b.sort_order);
  const baseImages = orderedFiles.map((f) => f.image_url);
  const hasVariants = variants.length > 0;

  // 1) Produit
  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      shop_id: shopId,
      name: detected.title.trim(),
      price,
      description: detected.description ?? null,
      category: detected.category ?? null,
      product_main_category: null,
      is_active: true,
      track_stock: false,
      has_variants: hasVariants,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  const productId = (inserted as { id: string }).id;

  // 2) Images de base (galerie + repli)
  if (baseImages.length > 0) {
    await supabase
      .from("product_images")
      .insert(baseImages.map((url, i) => ({ product_id: productId, image_url: url, position: i })));
    await supabase.from("products").update({ image_url: baseImages[0] }).eq("id", productId);
  }

  // 3) Variantes V3
  if (hasVariants) {
    const byAttr = new Map<string, { value: string; hex: string | null }[]>();
    for (const v of variants) {
      const arr = byAttr.get(v.attribute_name) ?? [];
      if (!arr.some((x) => x.value === v.value)) arr.push({ value: v.value, hex: v.hex });
      byAttr.set(v.attribute_name, arr);
    }
    const attributes: DraftAttribute[] = [...byAttr.entries()].map(([name, values]) => ({
      name,
      values,
    }));

    const combos = generateCombos(attributes);
    const comboDrafts: ComboDraft[] = combos.map((c) => {
      // Images : fichiers dont le libellé correspond à la combinaison ou à la couleur.
      const colorPart = c.parts.find((p) => p.attribute === "Couleur")?.value ?? null;
      const matched = orderedFiles.filter((f) => {
        const label = f.variant_label ?? "";
        if (label === c.label) return true;
        if (colorPart && label.toLowerCase().includes(colorPart.toLowerCase())) return true;
        return false;
      });
      const images = matched.map((f) => f.image_url).slice(0, MAX_VARIANT_IMAGES);
      return {
        key: c.key,
        label: c.label,
        parts: c.parts,
        stock: "0",
        price: "",
        active: true,
        images,
      };
    });

    const draft: VariantDraft = { enabled: true, attributes, combos: comboDrafts };
    await saveProductVariants(productId, draft);
  }

  // 4) Marque le produit détecté comme publié.
  await supabase
    .from("import_detected_products")
    .update({ status: "published", published_product_id: productId, updated_at: new Date().toISOString() })
    .eq("id", detected.id);

  return { ok: true, productId };
}
