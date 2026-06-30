import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCustomerOrderStatusEmail } from "@/lib/email";
import {
  buildCustomerNotificationText,
  type OrderNotificationContext,
} from "@/lib/order-notification-templates";
import { formatOrderNumber } from "@/lib/customer-order-status";
import { statusMeta } from "@/lib/order-status";
import type { CustomerNotificationType } from "@/lib/customer-order-status";
import { APP_ERROR_ACTIONS, logAppError } from "@/lib/app-error-log";

function createAuthClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );
}

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      orderId?: string;
      notificationType?: CustomerNotificationType;
    };
    const orderId = body.orderId?.trim();
    const notificationType = body.notificationType;

    if (!orderId || !notificationType) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const authClient = createAuthClient(token);
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: shop } = await authClient
      .from("shops")
      .select("id, name, slug")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shop) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { data: order, error: orderError } = await authClient
      .from("orders")
      .select(
        "id, status, total, customer_name, customer_email, created_at, shop_id, tracking_number, tracking_carrier, order_items(product_name, quantity, unit_price, size, variant_label)"
      )
      .eq("id", orderId)
      .eq("shop_id", shop.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    const orderPageUrl = `${appOrigin()}/${shop.slug}/order/${order.id}`;
    const items = (order.order_items ?? []) as OrderNotificationContext["items"];

    const ctx: OrderNotificationContext = {
      orderId: order.id,
      shopName: shop.name,
      shopSlug: shop.slug,
      customerName: (order.customer_name as string) || "Client",
      total: Number(order.total),
      createdAt: order.created_at as string,
      items,
      trackingNumber: order.tracking_number as string | null,
      trackingCarrier: order.tracking_carrier as string | null,
      orderPageUrl,
    };

    const messageText = buildCustomerNotificationText(notificationType, ctx);
    const customerEmail = (order.customer_email as string | null)?.trim();
    const orderNumber = formatOrderNumber(order.id);
    const orderStatusLabel = statusMeta(order.status as string).label;

    let emailSent = false;
    if (customerEmail) {
      const result = await sendCustomerOrderStatusEmail({
        to: customerEmail,
        type: notificationType,
        shopName: shop.name,
        orderId: order.id,
        customerName: ctx.customerName,
        total: ctx.total,
        createdAt: ctx.createdAt,
        items,
        trackingNumber: ctx.trackingNumber,
        trackingCarrier: ctx.trackingCarrier,
        orderPageUrl,
      });
      emailSent = result.ok;
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      manualFallbackRequired: !emailSent,
      messageText,
      orderNumber,
      orderStatus: order.status,
      orderStatusLabel,
      hasCustomerEmail: Boolean(customerEmail),
      orderPageUrl,
    });
  } catch (err) {
    await logAppError({
      action: APP_ERROR_ACTIONS.API_EMAIL_ORDER_STATUS,
      route: "/api/email/order-status",
      message: err instanceof Error ? err.message : "internal_error",
    });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
