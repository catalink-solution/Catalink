import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";

/** Aligné sur RLS storefront : is_active + boutique non suspendue. */
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

export type StorefrontProductsResult = {
  products: Product[];
  error: { message: string; code?: string } | null;
};

type StorefrontDebugInput = {
  slug: string;
  shopId: string;
  shopName?: string;
  productsReturned: number;
  supabaseError?: string | null;
  supabaseCode?: string | null;
};

/** Log serveur uniquement — jamais exposé aux visiteurs. */
export async function logStorefrontDebug(
  admin: SupabaseClient | null | undefined,
  input: StorefrontDebugInput
): Promise<void> {
  if (!admin) return;

  const { data: rows, error: countError } = await admin
    .from("products")
    .select("id, name, is_active, image_url, product_main_category, category, shop_id")
    .eq("shop_id", input.shopId);

  const all = (rows ?? []) as DiagnosticProductRow[];
  const activeCount = all.filter((p) => p.is_active).length;

  const payload = {
    slug: input.slug,
    shop_id: input.shopId,
    shop_name: input.shopName ?? null,
    total_products_for_shop: all.length,
    active_products_for_shop: activeCount,
    products_returned_to_storefront: input.productsReturned,
    supabase_error: input.supabaseError ?? null,
    supabase_code: input.supabaseCode ?? null,
    admin_count_error: countError?.message ?? null,
    mismatch:
      input.productsReturned === 0 &&
      activeCount > 0 &&
      !input.supabaseError,
  };

  if (input.supabaseError || payload.mismatch || (activeCount > 0 && input.productsReturned === 0)) {
    console.error("[storefront-debug]", JSON.stringify(payload));
    if (payload.mismatch && all.length > 0) {
      console.error(
        "[storefront-debug] product sample",
        JSON.stringify(
          all.slice(0, 5).map((p) => ({
            product_id: p.id,
            name: p.name,
            is_active: p.is_active,
            shop_id: p.shop_id,
          }))
        )
      );
    }
    return;
  }

  if (process.env.NODE_ENV !== "production" && all.length > 0) {
    console.info("[storefront-debug]", JSON.stringify(payload));
  }
}

/**
 * Produits visibles storefront — même filtre que RLS (is_active + shop non suspendue).
 * Logue les erreurs Supabase au lieu de les avaler silencieusement.
 */
export async function fetchStorefrontProducts(
  client: SupabaseClient,
  shopId: string,
  slug: string,
  options?: { admin?: SupabaseClient | null; shopName?: string }
): Promise<StorefrontProductsResult> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    await logStorefrontDebug(options?.admin, {
      slug,
      shopId,
      shopName: options?.shopName,
      productsReturned: 0,
      supabaseError: error.message,
      supabaseCode: error.code,
    });
    return { products: [], error: { message: error.message, code: error.code } };
  }

  const products = (data ?? []) as Product[];

  await logStorefrontDebug(options?.admin, {
    slug,
    shopId,
    shopName: options?.shopName,
    productsReturned: products.length,
  });

  return { products, error: null };
}
