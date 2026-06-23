import { normalizeStatus } from "@/lib/order-status";

/** Customer-facing timeline steps (WhatsApp payment flow). */
export const CUSTOMER_ORDER_STEPS = [
  { key: "payment_pending", label: "En attente de paiement" },
  { key: "payment_confirmed", label: "Paiement confirmé" },
  { key: "preparation", label: "Préparation" },
  { key: "shipped", label: "Expédiée" },
  { key: "delivered", label: "Livrée" },
] as const;

export function customerStatusLabel(status: string | null | undefined): string {
  const s = normalizeStatus(status);
  if (s === "cancelled") return "Commande annulée";
  const idx = customerTimelineIndex(s);
  return CUSTOMER_ORDER_STEPS[idx]?.label ?? CUSTOMER_ORDER_STEPS[0].label;
}

/** 0–4 = active step index; -1 = cancelled. */
export function customerTimelineIndex(status: string | null | undefined): number {
  const s = normalizeStatus(status);
  if (s === "cancelled") return -1;
  if (s === "new") return 0;
  if (s === "supplying") return 1;
  if (s === "received") return 2;
  if (s === "shipped") return 3;
  if (s === "delivered") return 4;
  return 0;
}

export type CustomerNotificationType = "confirmed" | "shipped" | "delivered";

/** Returns notification type when seller updates status in a customer-notifiable way. */
export function getCustomerNotificationType(
  previousStatus: string | null | undefined,
  nextStatus: string
): CustomerNotificationType | null {
  const prev = normalizeStatus(previousStatus);
  const next = normalizeStatus(nextStatus);
  if (prev === next || next === "cancelled") return null;

  if (prev === "new" && (next === "supplying" || next === "received")) {
    return "confirmed";
  }
  if (next === "shipped" && prev !== "shipped" && prev !== "delivered") {
    return "shipped";
  }
  if (next === "delivered" && prev !== "delivered") {
    return "delivered";
  }
  return null;
}

export function formatOrderNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
