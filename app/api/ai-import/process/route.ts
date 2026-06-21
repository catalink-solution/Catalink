import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";
import { stepJob } from "@/lib/ai-import/processor";

export const maxDuration = 60;

// Avance un job d'import d'une étape. Appelé en boucle par le client (polling)
// et/ou par le cron. Auth : token utilisateur propriétaire OU secret cron.
export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 500 });
  }

  let body: { jobId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const jobId = body.jobId?.trim();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  // Vérifie la propriété du job (sauf appel cron autorisé).
  const cronSecret = request.headers.get("x-cron-secret");
  const isCron = Boolean(process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET);

  if (!isCron) {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: job } = await admin
      .from("import_jobs")
      .select("shop_id")
      .eq("id", jobId)
      .maybeSingle();
    if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { data: shop } = await admin
      .from("shops")
      .select("user_id")
      .eq("id", (job as { shop_id: string }).shop_id)
      .maybeSingle();
    if ((shop as { user_id?: string } | null)?.user_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  try {
    const step = await stepJob(admin, jobId);
    return NextResponse.json({ ok: true, ...step });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "internal_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
