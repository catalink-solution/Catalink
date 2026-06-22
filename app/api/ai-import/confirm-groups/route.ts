import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";
import { confirmGroupsAndGenerate } from "@/lib/ai-import/processor";

export const maxDuration = 60;

/** Valide les groupes proposés et lance la génération de contenu. */
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

  const { data: job } = await admin.from("import_jobs").select("shop_id, status").eq("id", jobId).maybeSingle();
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: shop } = await admin
    .from("shops")
    .select("user_id")
    .eq("id", (job as { shop_id: string }).shop_id)
    .maybeSingle();
  if ((shop as { user_id?: string } | null)?.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const res = await confirmGroupsAndGenerate(admin, jobId);
  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? "confirm_failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: "generating" });
}
