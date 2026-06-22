import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchAdminUsers } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 500 });
  }

  try {
    const users = await fetchAdminUsers(admin);
    return NextResponse.json({ ok: true, users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "users_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
