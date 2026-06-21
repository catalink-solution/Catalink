import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendOrderNotificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string };
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ skipped: true, reason: "admin_not_configured" });
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, total, customer_name, created_at, shop_id, order_items(quantity)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    // Only send for recent orders (prevents abuse of public endpoint)
    const created = new Date(order.created_at as string).getTime();
    if (Date.now() - created > 15 * 60 * 1000) {
      return NextResponse.json({ error: "order_too_old" }, { status: 403 });
    }

    const { data: shop } = await admin
      .from("shops")
      .select("name, slug, user_id")
      .eq("id", order.shop_id)
      .maybeSingle();

    if (!shop?.user_id) {
      return NextResponse.json({ skipped: true, reason: "no_shop_owner" });
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(
      shop.user_id
    );
    const ownerEmail = userData?.user?.email;
    if (userError || !ownerEmail) {
      return NextResponse.json({ skipped: true, reason: "no_owner_email" });
    }

    const items = (order.order_items ?? []) as Array<{ quantity: number }>;
    const itemCount = items.reduce((s, i) => s + (i.quantity ?? 0), 0);

    const result = await sendOrderNotificationEmail({
      to: ownerEmail,
      shopName: shop.name,
      shopSlug: shop.slug,
      orderId: order.id,
      customerName: (order.customer_name as string) || "Client",
      total: Number(order.total),
      itemCount,
    });

    if (!result.ok) {
      return NextResponse.json({ skipped: true, reason: result.error });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
