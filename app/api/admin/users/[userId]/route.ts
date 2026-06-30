import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin/auth";
import { activateUser, deleteUser, suspendUser, updateSubscription, UserDeleteBlockedError } from "@/lib/admin/actions";
import {
  CANNOT_MODIFY_PLATFORM_ADMIN,
  PlatformAdminProtectedError,
  USER_HAS_ORDERS,
  isProtectedAdminAction,
} from "@/lib/admin/protection";
import { isAdminEmail } from "@/lib/admin/auth";

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

  const action = body.action ?? "";
  if (isProtectedAdminAction(action)) {
    const { data: targetUser, error: userErr } = await admin.auth.admin.getUserById(userId);
    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 500 });
    }
    if (isAdminEmail(targetUser.user?.email)) {
      return NextResponse.json({ error: CANNOT_MODIFY_PLATFORM_ADMIN }, { status: 403 });
    }
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
    if (e instanceof PlatformAdminProtectedError) {
      return NextResponse.json({ error: CANNOT_MODIFY_PLATFORM_ADMIN }, { status: 403 });
    }
    const msg = e instanceof Error ? e.message : "action_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = await params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 500 });
  }

  const { data: targetUser, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  if (isAdminEmail(targetUser.user?.email)) {
    return NextResponse.json({ error: CANNOT_MODIFY_PLATFORM_ADMIN }, { status: 403 });
  }

  try {
    await deleteUser(admin, auth.adminEmail, auth.user.id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PlatformAdminProtectedError) {
      return NextResponse.json({ error: CANNOT_MODIFY_PLATFORM_ADMIN }, { status: 403 });
    }
    if (e instanceof UserDeleteBlockedError) {
      const status = e.code === USER_HAS_ORDERS ? 409 : 403;
      return NextResponse.json({ error: e.code }, { status });
    }
    console.error("[admin] deleteUser failed:", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
