// Carriers + tracking-link helpers.
//
// 17TRACK integration is intentionally NOT wired up yet. The code below is
// structured so it can be activated later: set NEXT_PUBLIC_17TRACK_API_KEY in
// .env.local and build a real API client on top of `is17TrackEnabled`.

export const CARRIERS = [
  "DHL",
  "DPD",
  "FedEx",
  "Colissimo",
  "Chronopost",
  "Autre",
] as const;

export type Carrier = (typeof CARRIERS)[number];

// ─── 17TRACK live status labels ─────────────────────────────────────────────
// Maps 17TRACK API v2.2 `latest_status.status` values to FR labels + styles.
export const TRACK_STATUS_META: Record<string, { label: string; cls: string }> = {
  NotFound: { label: "Introuvable", cls: "bg-white/10 text-white/50" },
  InfoReceived: { label: "Infos reçues", cls: "bg-blue-500/15 text-blue-300" },
  InTransit: { label: "En transit", cls: "bg-amber-500/15 text-amber-300" },
  AvailableForPickup: { label: "Disponible au retrait", cls: "bg-cyan-500/15 text-cyan-300" },
  OutForDelivery: { label: "En cours de livraison", cls: "bg-indigo-500/15 text-indigo-300" },
  Delivered: { label: "Livré", cls: "bg-green-500/15 text-green-300" },
  DeliveryFailure: { label: "Échec de livraison", cls: "bg-red-500/15 text-red-300" },
  Exception: { label: "Incident", cls: "bg-red-500/15 text-red-300" },
  Expired: { label: "Expiré", cls: "bg-white/10 text-white/50" },
};

export function trackStatusMeta(status: string | null | undefined): {
  label: string;
  cls: string;
} {
  if (status && TRACK_STATUS_META[status]) return TRACK_STATUS_META[status];
  return { label: status || "—", cls: "bg-white/10 text-white/50" };
}

/**
 * Builds a 17TRACK (French) tracking URL with the number pre-filled.
 * 17TRACK auto-detects the carrier from the number, so the carrier is only
 * stored for the seller's reference. No API key is required for this link.
 *
 * Example: https://t.17track.net/fr#nums=1Z999AA10123456784
 */
export function buildTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string
): string {
  const n = trackingNumber.trim();
  return `https://t.17track.net/fr#nums=${encodeURIComponent(n)}`;
}
