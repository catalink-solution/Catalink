import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";

/** Aligné sur RLS storefront : is_active + boutique non suspendue (géré layout/RLS). */
export function isStorefrontVisibleProduct(
  product: Pick<Product, "is_active">
): boolean {
  return product.is_active === true;
}

export function productVisibilityLabel(isActive: boolean): string {
  return isActive
    ? "Visible sur la boutique"
    : "Masqué — invisible sur la boutique publique";
}

type DiagnosticProductRow = {
  id: string;
  name: string;
  is_active: boolean;
  image_url: string | null;
  product_main_category: string | null;
  category: string | null;
  shop_id: string;
};

/** Log serveur uniquement — diagnostic quand 0 produit visible mais produits en base. */
export async function logStorefrontProductDiagnostic(
  admin: SupabaseClient,
  shopId: string,
  slug: string,
  visibleCount: number
): Promise<void> {
  if (visibleCount > 0) return;

  const { data } = await admin
    .from("products")
    .select("id, name, is_active, image_url, product_main_category, category, shop_id")
    .eq("shop_id", shopId);

  const rows = (data ?? []) as DiagnosticProductRow[];
  if (rows.length === 0) return;

  console.info(
    "[storefront] product visibility diagnostic",
    JSON.stringify({
      slug,
      shopId,
      visibleCount,
      totalInDb: rows.length,
      products: rows.map((p) => ({
        product_id: p.id,
        name: p.name,
        is_active: p.is_active,
        has_image: Boolean(p.image_url),
        category: p.product_main_category ?? p.category,
        excluded_reason: p.is_active ? null : "is_active_false",
      })),
    })
  );
}
