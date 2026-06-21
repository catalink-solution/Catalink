// Single source of truth for order statuses (labels, colors, transitions).
//
// Business flow:
//   new        → Nouvelle              (commande reçue)
//   supplying  → En approvisionnement  (on achète / récupère les produits)
//   received   → Reçue à la logistique (produits reçus, prêts à expédier)
//   shipped    → Expédiée              (numéro de suivi renseigné)
//   delivered  → Livrée                (17track confirme la livraison)
//   cancelled  → Annulée

export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Nouvelle", cls: "bg-violet-500/15 text-violet-300" },
  supplying: { label: "En approvisionnement", cls: "bg-amber-500/15 text-amber-300" },
  received: { label: "Reçue à la logistique", cls: "bg-cyan-500/15 text-cyan-300" },
  shipped: { label: "Expédiée", cls: "bg-blue-500/15 text-blue-300" },
  delivered: { label: "Livrée", cls: "bg-green-500/15 text-green-300" },
  cancelled: { label: "Annulée", cls: "bg-red-500/15 text-red-300" },
};

// Order shown in filters and selects.
export const ORDER_STATUS_KEYS = [
  "new",
  "supplying",
  "received",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// Legacy values from earlier versions → new keys (non-destructive display).
const LEGACY_STATUS: Record<string, string> = {
  processing: "supplying",
  shipping: "shipped",
  done: "delivered",
};

/** Maps any stored status value (incl. legacy/unknown) to a current key. */
export function normalizeStatus(raw: string | null | undefined): string {
  if (!raw) return "new";
  if (raw in ORDER_STATUS) return raw;
  if (raw in LEGACY_STATUS) return LEGACY_STATUS[raw];
  return "new";
}

/**
 * A locked order must never be modified automatically (rules 4 & 5):
 * cancelled orders and already-delivered orders stay as-is.
 */
export function isAutoLocked(status: string | null | undefined): boolean {
  const s = normalizeStatus(status);
  return s === "cancelled" || s === "delivered";
}

export function statusMeta(status: string | null | undefined): {
  label: string;
  cls: string;
} {
  return ORDER_STATUS[normalizeStatus(status)] ?? ORDER_STATUS.new;
}
