import { formatPrice, formatDate } from "@/lib/format";
import { formatOrderNumber } from "@/lib/customer-order-status";
import type { CustomerNotificationType } from "@/lib/customer-order-status";
import { escapeHtml } from "@/lib/escape-html";

export type OrderNotificationContext = {
  orderId: string;
  shopName: string;
  shopSlug: string;
  customerName: string;
  total: number;
  createdAt?: string | null;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    variant_label?: string | null;
    size?: string | null;
  }>;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  orderPageUrl: string;
};

function itemLines(items: OrderNotificationContext["items"]): string {
  return items
    .map((i) => {
      const variant = i.variant_label || i.size;
      const suffix = variant ? ` (${variant})` : "";
      return `• ${i.quantity}× ${i.product_name}${suffix} — ${formatPrice(i.unit_price * i.quantity)}`;
    })
    .join("\n");
}

function itemLinesHtml(items: OrderNotificationContext["items"]): string {
  return items
    .map((i) => {
      const variant = i.variant_label || i.size;
      const suffix = variant ? ` (${escapeHtml(variant)})` : "";
      return `• ${i.quantity}× ${escapeHtml(i.product_name)}${suffix} — ${escapeHtml(formatPrice(i.unit_price * i.quantity))}`;
    })
    .join("<br/>");
}

const SUBJECTS: Record<CustomerNotificationType, string> = {
  confirmed: "Commande confirmée",
  shipped: "Commande expédiée",
  delivered: "Commande livrée",
};

export function customerNotificationSubject(
  type: CustomerNotificationType,
  shopName: string
): string {
  return `${SUBJECTS[type]} · ${shopName}`;
}

export function buildCustomerNotificationText(
  type: CustomerNotificationType,
  ctx: OrderNotificationContext
): string {
  const ref = formatOrderNumber(ctx.orderId);
  const lines = itemLines(ctx.items);
  const tracking =
    ctx.trackingNumber && type === "shipped"
      ? `\n\nNuméro de suivi : ${ctx.trackingNumber}${
          ctx.trackingCarrier ? ` (${ctx.trackingCarrier})` : ""
        }`
      : "";

  const intro: Record<CustomerNotificationType, string> = {
    confirmed: `Bonjour ${ctx.customerName},\n\nBonne nouvelle ! Ta commande #${ref} chez ${ctx.shopName} est confirmée.`,
    shipped: `Bonjour ${ctx.customerName},\n\nTa commande #${ref} chez ${ctx.shopName} a été expédiée.`,
    delivered: `Bonjour ${ctx.customerName},\n\nTa commande #${ref} chez ${ctx.shopName} est livrée. Merci pour ta confiance !`,
  };

  return [
    intro[type],
    "",
    "Récapitulatif :",
    lines,
    "",
    `Total : ${formatPrice(ctx.total)}`,
    tracking,
    "",
    `Suivre ta commande : ${ctx.orderPageUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCustomerNotificationHtml(
  type: CustomerNotificationType,
  ctx: OrderNotificationContext
): string {
  const ref = escapeHtml(formatOrderNumber(ctx.orderId));
  const customerName = escapeHtml(ctx.customerName);
  const shopName = escapeHtml(ctx.shopName);
  const orderPageUrl = escapeHtml(ctx.orderPageUrl);
  const subject = escapeHtml(SUBJECTS[type]);
  const total = escapeHtml(formatPrice(ctx.total));

  const intro: Record<CustomerNotificationType, string> = {
    confirmed: `Bonjour ${customerName},<br/><br/>Bonne nouvelle ! Ta commande #${ref} chez ${shopName} est confirmée.`,
    shipped: `Bonjour ${customerName},<br/><br/>Ta commande #${ref} chez ${shopName} a été expédiée.`,
    delivered: `Bonjour ${customerName},<br/><br/>Ta commande #${ref} chez ${shopName} est livrée. Merci pour ta confiance !`,
  };

  const tracking =
    ctx.trackingNumber && type === "shipped"
      ? `<br/><br/>Numéro de suivi : ${escapeHtml(ctx.trackingNumber)}${
          ctx.trackingCarrier ? ` (${escapeHtml(ctx.trackingCarrier)})` : ""
        }`
      : "";

  const dateLine = ctx.createdAt
    ? escapeHtml(formatDate(ctx.createdAt))
    : "";

  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h1 style="font-size:20px;margin-bottom:8px">${subject}</h1>
      <p style="color:#555;margin-top:0;line-height:1.5">${intro[type]}</p>
      <p style="color:#555;margin-top:16px;line-height:1.5"><strong>Récapitulatif :</strong><br/>${itemLinesHtml(ctx.items)}</p>
      <p style="color:#555;margin-top:12px"><strong>Total :</strong> ${total}${tracking}</p>
      <p style="color:#555;margin-top:12px"><a href="${orderPageUrl}">Suivre ta commande</a></p>
      <p style="margin-top:24px;font-size:12px;color:#999">Commande #${ref}${dateLine ? ` · ${dateLine}` : ""}</p>
    </div>
  `;
}
