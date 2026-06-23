-- Security sprint: RLS shops, orders, products, storage, RPC hardening.
-- Apply after v2_* migrations (prod baseline).

-- ─── 1. Storefront shop view (public columns only) ───────────────────────────
CREATE OR REPLACE VIEW public.shops_storefront
WITH (security_invoker = false)
AS
SELECT
  id,
  name,
  slug,
  description,
  whatsapp,
  telegram,
  snapchat,
  instagram,
  tiktok,
  logo_url,
  created_at,
  COALESCE(is_suspended, false) AS is_suspended
FROM public.shops;

GRANT SELECT ON public.shops_storefront TO anon, authenticated;

COMMENT ON VIEW public.shops_storefront IS
  'Public storefront fields only. No user_id, plan, or subscription data.';

-- ─── 2. Shops RLS — owners only on base table ───────────────────────────────
DROP POLICY IF EXISTS "public read shops" ON public.shops;

-- users manage own shop (existing) remains the only shops access for authenticated owners

-- ─── 3. Products — hide inactive / suspended shop catalog ───────────────────
DROP POLICY IF EXISTS "public read active products" ON public.products;
CREATE POLICY "public read active products" ON public.products
  FOR SELECT
  TO public
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = products.shop_id
        AND COALESCE(s.is_suspended, false) = false
    )
  );

DROP POLICY IF EXISTS "public read variants" ON public.product_variants;
CREATE POLICY "public read variants" ON public.product_variants
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.shops s ON s.id = p.shop_id
      WHERE p.id = product_variants.product_id
        AND p.is_active = true
        AND COALESCE(s.is_suspended, false) = false
    )
  );

DROP POLICY IF EXISTS "public read images" ON public.product_images;
CREATE POLICY "public read images" ON public.product_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.shops s ON s.id = p.shop_id
      WHERE p.id = product_images.product_id
        AND p.is_active = true
        AND COALESCE(s.is_suspended, false) = false
    )
  );

-- ─── 4. Orders — no direct client INSERT ────────────────────────────────────
DROP POLICY IF EXISTS "public create orders" ON public.orders;
REVOKE INSERT ON public.orders FROM anon, authenticated;

-- ─── 5. create_order — block suspended shops ────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_order(
  p_shop_id uuid,
  p_customer_name text,
  p_customer_contact text,
  p_customer_address text,
  p_message text,
  p_items jsonb,
  p_customer_email text DEFAULT NULL::text,
  p_customer_phone text DEFAULT NULL::text,
  p_session_id text DEFAULT NULL::text,
  p_ref_code text DEFAULT NULL::text,
  p_promo_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
declare
  v_order_id uuid;
  v_total numeric := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_size text;
  v_variant_size text;
  v_stock integer;
  v_campaign_id uuid;
  v_customer_id uuid;
  v_email text := nullif(trim(p_customer_email), '');
  v_phone text := nullif(trim(p_customer_phone), '');
  v_sku_id uuid;
  v_variant_label text;
  v_sku public.product_skus%rowtype;
  v_unit_price numeric;
begin
  if not exists (select 1 from public.shops where id = p_shop_id) then
    raise exception 'shop_not_found';
  end if;

  if exists (
    select 1 from public.shops
    where id = p_shop_id and coalesce(is_suspended, false) = true
  ) then
    raise exception 'shop_suspended';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  if nullif(trim(p_ref_code), '') is not null then
    select id into v_campaign_id from public.campaign_links
      where shop_id = p_shop_id and lower(ref_code) = lower(trim(p_ref_code)) and is_active = true
      limit 1;
  end if;

  insert into public.orders (shop_id, customer_name, customer_contact, customer_address, message, status, total,
                             customer_email, customer_phone, campaign_link_id, ref_code, promo_code)
  values (p_shop_id, p_customer_name, p_customer_contact, p_customer_address, p_message, 'new', 0,
          v_email, v_phone, v_campaign_id, nullif(trim(p_ref_code), ''), nullif(trim(p_promo_code), ''))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid and shop_id = p_shop_id and is_active = true;
    if not found then
      raise exception 'product_unavailable';
    end if;

    v_qty := greatest(1, coalesce((v_item->>'quantity')::integer, 1));
    v_size := nullif(v_item->>'size', '');
    v_sku_id := nullif(v_item->>'sku_id', '')::uuid;
    v_variant_label := nullif(v_item->>'variant_label', '');
    v_unit_price := v_product.price;

    if v_sku_id is not null then
      select * into v_sku from public.product_skus
        where id = v_sku_id and product_id = v_product.id and active = true for update;
      if not found then
        raise exception 'variant_unavailable';
      end if;
      if v_sku.stock_quantity < v_qty then
        raise exception 'out_of_stock';
      end if;
      update public.product_skus set stock_quantity = stock_quantity - v_qty where id = v_sku_id;
      v_unit_price := coalesce(v_sku.price, v_product.price);
    elsif v_product.track_stock then
      v_variant_size := coalesce(v_size, 'Taille unique');
      select stock into v_stock from public.product_variants
        where product_id = v_product.id and size = v_variant_size for update;
      if not found or v_stock < v_qty then
        raise exception 'out_of_stock';
      end if;
      update public.product_variants set stock = stock - v_qty
        where product_id = v_product.id and size = v_variant_size;
    end if;

    insert into public.order_items (order_id, product_id, product_name, size, quantity, unit_price, sku_id, variant_label)
    values (v_order_id, v_product.id, v_product.name, v_size, v_qty, v_unit_price, v_sku_id, v_variant_label);

    v_total := v_total + (v_unit_price * v_qty);
  end loop;

  update public.orders set total = v_total where id = v_order_id;

  if v_phone is null and v_email is null then
    v_phone := nullif(trim(p_customer_contact), '');
  end if;

  select id into v_customer_id from public.customers
    where shop_id = p_shop_id
      and ( (v_email is not null and email = v_email)
         or (v_phone is not null and phone = v_phone) )
    limit 1;

  if v_customer_id is null then
    insert into public.customers (shop_id, name, phone, email, orders_count, total_spent, first_order_at, last_order_at)
    values (p_shop_id, p_customer_name, v_phone, v_email, 1, v_total, now(), now())
    returning id into v_customer_id;
  else
    update public.customers
      set orders_count = orders_count + 1,
          total_spent = total_spent + v_total,
          last_order_at = now(),
          name = coalesce(name, p_customer_name),
          phone = coalesce(phone, v_phone),
          email = coalesce(email, v_email)
    where id = v_customer_id;
  end if;

  update public.orders set customer_id = v_customer_id where id = v_order_id;

  if nullif(trim(p_session_id), '') is not null then
    update public.abandoned_carts set status = 'recovered', updated_at = now()
      where shop_id = p_shop_id and session_id = trim(p_session_id);
  end if;

  insert into public.notifications (user_id, shop_id, type, title, message, data)
  select s.user_id, p_shop_id, 'order_created', 'Nouvelle commande',
         coalesce(p_customer_name, 'Client') || ' · ' || to_char(v_total, 'FM999999990.00') || ' €',
         jsonb_build_object('order_id', v_order_id)
  from public.shops s where s.id = p_shop_id and s.user_id is not null;

  return v_order_id;
end;
$function$;

-- ─── 6. award_loyalty_on_delivery — shop owner only ─────────────────────────
CREATE OR REPLACE FUNCTION public.award_loyalty_on_delivery(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
declare
  v_order public.orders%rowtype;
  v_points integer;
  v_new_lifetime integer;
  v_tier text;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  if not exists (
    select 1
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.id = p_order_id and s.user_id = auth.uid()
  ) then
    raise exception 'forbidden';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found or v_order.customer_id is null then return; end if;
  if v_order.status is distinct from 'delivered' then return; end if;
  if v_order.loyalty_points_awarded then return; end if;

  v_points := greatest(0, floor(coalesce(v_order.total, 0))::integer);

  insert into public.customer_loyalty (shop_id, customer_id, points, lifetime_points, tier, updated_at)
  values (
    v_order.shop_id,
    v_order.customer_id,
    v_points,
    v_points,
    case when v_points >= 1500 then 'Gold' when v_points >= 500 then 'Silver' else 'Bronze' end,
    now()
  )
  on conflict (shop_id, customer_id) do update
    set points = public.customer_loyalty.points + excluded.points,
        lifetime_points = public.customer_loyalty.lifetime_points + excluded.points,
        updated_at = now();

  select lifetime_points into v_new_lifetime
  from public.customer_loyalty
  where shop_id = v_order.shop_id and customer_id = v_order.customer_id;

  v_tier := case
    when v_new_lifetime >= 1500 then 'Gold'
    when v_new_lifetime >= 500 then 'Silver'
    else 'Bronze'
  end;

  update public.customer_loyalty
    set tier = v_tier
  where shop_id = v_order.shop_id and customer_id = v_order.customer_id;

  update public.orders set loyalty_points_awarded = true where id = p_order_id;
end;
$function$;

REVOKE ALL ON FUNCTION public.award_loyalty_on_delivery(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_loyalty_on_delivery(uuid) TO authenticated, service_role;

-- ─── 7. upsert_abandoned_cart — reject suspended shops ──────────────────────
CREATE OR REPLACE FUNCTION public.upsert_abandoned_cart(
  p_shop_id uuid,
  p_session_id text,
  p_items jsonb,
  p_total numeric,
  p_name text DEFAULT NULL::text,
  p_phone text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
declare v_id uuid;
begin
  if p_session_id is null or trim(p_session_id) = '' then raise exception 'session_required'; end if;
  if not exists (select 1 from public.shops where id = p_shop_id) then raise exception 'shop_not_found'; end if;
  if exists (
    select 1 from public.shops
    where id = p_shop_id and coalesce(is_suspended, false) = true
  ) then
    raise exception 'shop_suspended';
  end if;
  insert into public.abandoned_carts (shop_id, session_id, items, total, customer_name, customer_phone, customer_email, status, updated_at)
  values (p_shop_id, trim(p_session_id), coalesce(p_items, '[]'::jsonb), coalesce(p_total, 0),
          nullif(trim(p_name), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), 'active', now())
  on conflict (shop_id, session_id) do update
    set items = excluded.items, total = excluded.total,
        customer_name = coalesce(excluded.customer_name, public.abandoned_carts.customer_name),
        customer_phone = coalesce(excluded.customer_phone, public.abandoned_carts.customer_phone),
        customer_email = coalesce(excluded.customer_email, public.abandoned_carts.customer_email),
        status = case when public.abandoned_carts.status = 'recovered' then 'recovered' else 'active' end,
        updated_at = now()
  returning id into v_id;
  return v_id;
end;
$function$;

-- ─── 8. Storage product-images — scoped uploads ─────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

CREATE POLICY "public read product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "vendor upload own shop folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT s.id::text FROM public.shops s WHERE s.user_id = auth.uid()
    )
    OR (storage.foldername(name))[1] = 'logos'
  )
);

CREATE POLICY "public review photo upload"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'reviews'
);
