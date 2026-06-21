import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { stepJob } from "@/lib/ai-import/processor";

export const maxDuration = 60;

// Worker de secours : avance les jobs non terminés. À brancher sur un Vercel Cron
// (vercel.json) ou un appel planifié externe. Protégé par CRON_SECRET.
async function handle(request: Request) {
  // Vercel Cron envoie « Authorization: Bearer <CRON_SECRET> ». On accepte aussi
  // x-cron-secret ou ?secret= pour les déclenchements manuels.
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const secret =
    request.headers.get("x-cron-secret") ??
    bearer ??
    new URL(request.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "service_not_configured" }, { status: 500 });

  const { data: jobs } = await admin
    .from("import_jobs")
    .select("id")
    .in("status", ["pending", "analyzing", "clustering", "generating"])
    .order("created_at", { ascending: true })
    .limit(5);

  const processed: { jobId: string; status: string }[] = [];
  for (const j of (jobs ?? []) as { id: string }[]) {
    try {
      const step = await stepJob(admin, j.id);
      processed.push({ jobId: j.id, status: step.status });
    } catch {
      processed.push({ jobId: j.id, status: "error" });
    }
  }

  return NextResponse.json({ ok: true, processed });
}

export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
