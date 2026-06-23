-- Sprint 2: public order tracking by shop slug + order reference (UUID full or prefix).

CREATE OR REPLACE FUNCTION public.get_order_for_customer(
  p_shop_slug text,
  p_order_ref text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_shop_id uuid;
  v_order public.orders%rowtype;
  v_items jsonb;
  v_ref text := nullif(trim(p_order_ref), '');
BEGIN
  IF v_ref IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  SELECT id INTO v_shop_id
  FROM public.shops
  WHERE slug = trim(p_shop_slug)
  LIMIT 1;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'shop_not_found';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE shop_id = v_shop_id
    AND (
      id::text = v_ref
      OR id::text ILIKE v_ref || '%'
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'size', oi.size,
        'variant_label', oi.variant_label
      )
      ORDER BY oi.created_at
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'order_number', left(v_order.id::text, 8),
    'created_at', v_order.created_at,
    'customer_name', v_order.customer_name,
    'status', v_order.status,
    'total', v_order.total,
    'tracking_number', v_order.tracking_number,
    'tracking_carrier', v_order.tracking_carrier,
    'tracking_last_event', v_order.tracking_last_event,
    'items', v_items
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_order_for_customer(text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_order_for_customer IS
  'Public order lookup for customer tracking page. Access gated by order UUID reference.';
