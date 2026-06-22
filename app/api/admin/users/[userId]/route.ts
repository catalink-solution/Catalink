import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin/auth";
import { activateUser, suspendUser, updateSubscription } from "@/lib/admin/actions";

type RouteParams = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = await params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 500 });
  }

  let body: {
    action?: string;
    shopId?: string;
    plan?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    if (body.action === "suspend") {
      await suspendUser(admin, auth.adminEmail, userId, body.shopId ?? null);
      return NextResponse.json({ ok: true, status: "suspended" });
    }
    if (body.action === "activate") {
      await activateUser(admin, auth.adminEmail, userId, body.shopId ?? null);
      return NextResponse.json({ ok: true, status: "active" });
    }
    if (body.action === "update_subscription" && body.shopId) {
      await updateSubscription(admin, auth.adminEmail, body.shopId, userId, {
        plan: body.plan,
        subscriptionStatus: body.subscriptionStatus,
        subscriptionExpiresAt: body.subscriptionExpiresAt,
      });
      return NextResponse.json({ ok: true, status: "updated" });
    }
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "action_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
