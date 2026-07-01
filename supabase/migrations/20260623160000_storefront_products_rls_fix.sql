-- Fix storefront product visibility: public RLS policies referenced `shops`
-- which anon cannot read after security sprint removed "public read shops".
-- Use SECURITY DEFINER helper so suspension check works without exposing shops rows.

CREATE OR REPLACE FUNCTION public.is_shop_publicly_visible(p_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops s
    WHERE s.id = p_shop_id
      AND COALESCE(s.is_suspended, false) = false
  );
$$;

REVOKE ALL ON FUNCTION public.is_shop_publicly_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_shop_publicly_visible(uuid) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.is_shop_publicly_visible(uuid) IS
  'True when shop exists and is not suspended. Used by storefront RLS (anon-safe).';

-- ─── products ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public read active products" ON public.products;
CREATE POLICY "public read active products" ON public.products
  FOR SELECT
  TO public
  USING (
    is_active = true
    AND public.is_shop_publicly_visible(shop_id)
  );

-- ─── product_variants ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public read variants" ON public.product_variants;
CREATE POLICY "public read variants" ON public.product_variants
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_variants.product_id
        AND p.is_active = true
        AND public.is_shop_publicly_visible(p.shop_id)
    )
  );

-- ─── product_images ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public read images" ON public.product_images;
CREATE POLICY "public read images" ON public.product_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.is_active = true
        AND public.is_shop_publicly_visible(p.shop_id)
    )
  );

-- ─── product_skus (was unrestricted SELECT true) ────────────────────────────
DROP POLICY IF EXISTS "public read product_skus" ON public.product_skus;
CREATE POLICY "public read product_skus" ON public.product_skus
  FOR SELECT
  TO public
  USING (
    active = true
    AND EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_skus.product_id
        AND p.is_active = true
        AND public.is_shop_publicly_visible(p.shop_id)
    )
  );

-- ─── variant V3 tables (were unrestricted SELECT true) ──────────────────────
DROP POLICY IF EXISTS "public read product_attributes" ON public.product_attributes;
CREATE POLICY "public read product_attributes" ON public.product_attributes
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_attributes.product_id
        AND p.is_active = true
        AND public.is_shop_publicly_visible(p.shop_id)
    )
  );

DROP POLICY IF EXISTS "public read product_attribute_values" ON public.product_attribute_values;
CREATE POLICY "public read product_attribute_values" ON public.product_attribute_values
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_attributes a
      JOIN public.products p ON p.id = a.product_id
      WHERE a.id = product_attribute_values.attribute_id
        AND p.is_active = true
        AND public.is_shop_publicly_visible(p.shop_id)
    )
  );

DROP POLICY IF EXISTS "public read product_sku_values" ON public.product_sku_values;
CREATE POLICY "public read product_sku_values" ON public.product_sku_values
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_skus k
      JOIN public.products p ON p.id = k.product_id
      WHERE k.id = product_sku_values.sku_id
        AND k.active = true
        AND p.is_active = true
        AND public.is_shop_publicly_visible(p.shop_id)
    )
  );

DROP POLICY IF EXISTS "public read product_sku_images" ON public.product_sku_images;
CREATE POLICY "public read product_sku_images" ON public.product_sku_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_skus k
      JOIN public.products p ON p.id = k.product_id
      WHERE k.id = product_sku_images.sku_id
        AND k.active = true
        AND p.is_active = true
        AND public.is_shop_publicly_visible(p.shop_id)
    )
  );
