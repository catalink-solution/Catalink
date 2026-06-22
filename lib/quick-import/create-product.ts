// Création produit depuis Import Rapide (sans IA, validation utilisateur obligatoire).

import { supabase } from "@/lib/supabase";

export type QuickProductInput = {
  shopId: string;
  name: string;
  price: number;
  description?: string;
  mainCategory: string;
  imageUrls: string[];
};

export async function createQuickProduct(
  input: QuickProductInput
): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  const { shopId, name, price, description, mainCategory, imageUrls } = input;

  if (!name.trim()) return { ok: false, error: "Le nom est obligatoire." };
  if (!mainCategory) return { ok: false, error: "La catégorie est obligatoire." };
  if (isNaN(price) || price < 0) return { ok: false, error: "Prix invalide." };
  if (imageUrls.length === 0) return { ok: false, error: "Ajoute au moins une photo." };

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      shop_id: shopId,
      name: name.trim(),
      price,
      description: description?.trim() || null,
      image_url: imageUrls[0] ?? null,
      category: mainCategory,
      product_main_category: mainCategory,
      product_custom_category_id: null,
      sizes: [],
      is_active: true,
      track_stock: false,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Erreur lors de la création." };
  }

  const productId = (inserted as { id: string }).id;
  const rows = imageUrls.map((url, i) => ({
    product_id: productId,
    image_url: url,
    position: i,
  }));
  const { error: imgErr } = await supabase.from("product_images").insert(rows);
  if (imgErr) {
    await supabase.from("products").delete().eq("id", productId);
    return { ok: false, error: imgErr.message };
  }

  return { ok: true, productId };
}

export async function uploadProductImage(shopId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `${shopId}/quick-import/${fileName}`;
  const { error } = await supabase.storage.from("product-images").upload(filePath, file);
  if (error) return null;
  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
  return data.publicUrl;
}
