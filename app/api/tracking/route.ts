// Server-side proxy to the 17TRACK Tracking API (v2.2).
// The API key stays on the server (never shipped to the browser).
// Configure it in .env.local as SEVENTEEN_TRACK_API_KEY=...

const API_BASE = "https://api.17track.net/track/v2.2";

const API_KEY =
  process.env.SEVENTEEN_TRACK_API_KEY ??
  process.env.NEXT_PUBLIC_17TRACK_API_KEY ??
  "";

async function call17track(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: {
      "17token": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return res.json();
}

type TrackEvent = {
  status: string | null;
  description: string | null;
  location: string | null;
  time: string | null;
};

// Extracts the full checkpoint history from a 17track v2.2 track_info object.
function extractEvents(trackInfo: unknown): TrackEvent[] {
  const ti = trackInfo as
    | { tracking?: { providers?: Array<{ events?: unknown[] }> } }
    | undefined;
  const providers = ti?.tracking?.providers ?? [];
  const provider = providers.find((p) => Array.isArray(p?.events) && p.events.length > 0);
  const raw = (provider?.events ?? []) as Array<Record<string, unknown>>;
  return raw.map((e) => ({
    status: (e.stage as string) ?? null,
    description: (e.description as string) ?? null,
    location: (e.location as string) ?? null,
    time: (e.time_iso as string) ?? (e.time_utc as string) ?? null,
  }));
}

export async function POST(request: Request) {
  if (!API_KEY) {
    return Response.json(
      {
        ok: false,
        configured: false,
        error:
          "17track n'est pas configuré. Ajoute SEVENTEEN_TRACK_API_KEY dans .env.local puis redémarre le serveur.",
      },
      { status: 400 }
    );
  }

  let payload: { action?: string; number?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const number = (payload.number ?? "").trim();
  if (!number) {
    return Response.json({ ok: false, error: "Numéro de suivi manquant." }, { status: 400 });
  }

  try {
    if (payload.action === "register") {
      const data = await call17track("register", [{ number }]);
      return Response.json({ ok: true, data });
    }

    // Default action = status. Register first (idempotent) so 17track starts
    // crawling the number, then fetch the latest tracking info.
    await call17track("register", [{ number }]).catch(() => undefined);
    const info = await call17track("gettrackinfo", [{ number }]);

    const accepted = info?.data?.accepted?.[0];
    const trackInfo = accepted?.track_info;
    const status: string | null = trackInfo?.latest_status?.status ?? null;
    const latestEvent: string | null =
      trackInfo?.latest_event?.description ??
      trackInfo?.latest_event?.stage ??
      null;
    const latestEventAt: string | null = trackInfo?.latest_event?.time_iso ?? null;

    const rejected = info?.data?.rejected?.[0];
    if (!accepted && rejected) {
      return Response.json({
        ok: true,
        status: null,
        latestEvent: null,
        latestEventAt: null,
        events: [],
        note: "Numéro non encore reconnu par 17track (réessaie plus tard).",
      });
    }

    const events = extractEvents(trackInfo);
    return Response.json({ ok: true, status, latestEvent, latestEventAt, events });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur 17track." },
      { status: 502 }
    );
  }
}
