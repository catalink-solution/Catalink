// 17TRACK integration service (client-side entry point).
//
// This wraps the server route /api/tracking, which holds the secret
// SEVENTEEN_TRACK_API_KEY. If the key is missing, `configured` is false and
// the caller should fall back to manual tracking ("Suivi manuel uniquement").
//
// The actual 17TRACK calls live server-side in app/api/tracking/route.ts so
// the API key never reaches the browser.

export type TrackingEventDTO = {
  status: string | null;
  description: string | null;
  location: string | null;
  time: string | null;
};

export type TrackingSyncResult = {
  ok: boolean;
  configured: boolean;
  /** Raw 17TRACK status, e.g. "InTransit", "Delivered" (null if unknown yet). */
  trackingStatus: string | null;
  latestEvent: string | null;
  latestEventAt: string | null;
  events: TrackingEventDTO[];
  note?: string;
  error?: string;
};

/**
 * Fetches the latest delivery status from 17TRACK for a tracking number.
 * Never throws: returns a structured result so the UI can degrade gracefully.
 */
export async function syncTrackingStatus(
  trackingNumber: string | null | undefined
): Promise<TrackingSyncResult> {
  const number = (trackingNumber ?? "").trim();
  if (!number) {
    return {
      ok: false,
      configured: true,
      trackingStatus: null,
      latestEvent: null,
      latestEventAt: null,
      events: [],
      error: "Numéro de suivi manquant.",
    };
  }

  try {
    const res = await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", number }),
    });
    const json = await res.json();

    if (!json.ok) {
      return {
        ok: false,
        configured: json.configured !== false,
        trackingStatus: null,
        latestEvent: null,
        latestEventAt: null,
        events: [],
        error: json.error ?? "Erreur 17track.",
      };
    }

    return {
      ok: true,
      configured: true,
      trackingStatus: json.status ?? null,
      latestEvent: json.latestEvent ?? null,
      latestEventAt: json.latestEventAt ?? null,
      events: Array.isArray(json.events) ? json.events : [],
      note: json.note,
    };
  } catch {
    return {
      ok: false,
      configured: true,
      trackingStatus: null,
      latestEvent: null,
      latestEventAt: null,
      events: [],
      error: "Impossible de contacter 17track.",
    };
  }
}

/** 17TRACK marks a parcel delivered with this status value. */
export function isDeliveredStatus(trackingStatus: string | null | undefined): boolean {
  return trackingStatus === "Delivered";
}
