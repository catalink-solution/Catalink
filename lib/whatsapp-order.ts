import { formatPrice } from "@/lib/format";
import { formatOrderNumber } from "@/lib/customer-order-status";

export type WhatsAppOrderItem = {
  product_name: string;
  quantity: number;
  variant_label?: string | null;
  size?: string | null;
};

export function formatOrderItemLine(item: WhatsAppOrderItem): string {
  const variant = item.variant_label || item.size;
  const suffix = variant ? ` (${variant})` : "";
  return `• ${item.product_name}${suffix} x${item.quantity}`;
}

/** Professional pre-filled WhatsApp message for order finalization. */
export function buildWhatsAppOrderMessage(params: {
  orderId: string;
  items: WhatsAppOrderItem[];
  total: number;
}): string {
  const number = formatOrderNumber(params.orderId);
  const lines = params.items.map(formatOrderItemLine).join("\n");
  return [
    "Bonjour,",
    "",
    `Je souhaite finaliser la commande #${number}`,
    "",
    "Produits :",
    lines,
    "",
    "Montant total :",
    formatPrice(params.total),
    "",
    "Merci.",
  ].join("\n");
}

export function buildWhatsAppOrderUrl(
  whatsapp: string,
  params: { orderId: string; items: WhatsAppOrderItem[]; total: number }
): string {
  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return "";
  const text = encodeURIComponent(buildWhatsAppOrderMessage(params));
  return `https://wa.me/${digits}?text=${text}`;
}
