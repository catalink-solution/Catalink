import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin/auth";
import { inviteWaitlistProspect } from "@/lib/admin/actions";

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
    await inviteWaitlistProspect(admin, auth.adminEmail, id);
    return NextResponse.json({ ok: true, status: "invited", message: "Invitation envoyée par email." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invite_failed";
    if (msg === "not_found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg === "already_registered") {
      return NextResponse.json({ error: msg, status: "registered" }, { status: 409 });
    }
    if (msg === "declined") {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    if (msg === "invite_email_failed") {
      return NextResponse.json(
        { error: "invite_email_failed", message: "L'email d'invitation n'a pas pu être envoyé. Vérifie la config Supabase Auth." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
