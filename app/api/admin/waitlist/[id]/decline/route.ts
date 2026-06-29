import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin/auth";
import { declineWaitlistProspect } from "@/lib/admin/actions";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 500 });
  }

  try {
    await declineWaitlistProspect(admin, auth.adminEmail, id);
    return NextResponse.json({ ok: true, status: "declined" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "decline_failed";
    if (msg === "not_found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
