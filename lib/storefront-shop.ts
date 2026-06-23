import { supabase } from "@/lib/supabase";

/** Public storefront columns — query `shops_storefront` view, not `shops`. */
export const STOREFRONT_SHOP_SELECT =
  "id, name, slug, description, whatsapp, telegram, snapchat, instagram, tiktok, logo_url, created_at, is_suspended";

export async function fetchStorefrontShopBySlug(slug: string) {
  return supabase
    .from("shops_storefront")
    .select(STOREFRONT_SHOP_SELECT)
    .eq("slug", slug)
    .maybeSingle();
}
