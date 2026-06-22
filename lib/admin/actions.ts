import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "./queries";
import { assertNotPlatformAdmin } from "./protection";

const BAN_DURATION = "876000h"; // ~100 ans

async function assertTargetNotPlatformAdmin(
  admin: SupabaseClient,
  userId: string
): Promise<string | undefined> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw error;
  assertNotPlatformAdmin(data.user?.email);
  return data.user?.email;
}

export async function suspendUser(
  admin: SupabaseClient,
  adminEmail: string,
  userId: string,
  shopId: string | null
) {
  await assertTargetNotPlatformAdmin(admin, userId);

  const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: BAN_DURATION,
  });
  if (banErr) throw banErr;

  if (shopId) {
    await admin
      .from("shops")
      .update({ is_suspended: true, suspended_at: new Date().toISOString() })
      .eq("id", shopId);
  }

  await logAdminAction(admin, adminEmail, "suspend_account", { userId, shopId: shopId ?? undefined });
}

export async function activateUser(
  admin: SupabaseClient,
  adminEmail: string,
  userId: string,
  shopId: string | null
) {
  await assertTargetNotPlatformAdmin(admin, userId);

  const { error: unbanErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (unbanErr) throw unbanErr;

  if (shopId) {
    await admin
      .from("shops")
      .update({ is_suspended: false, suspended_at: null })
      .eq("id", shopId);
  }

  await logAdminAction(admin, adminEmail, "activate_account", { userId, shopId: shopId ?? undefined });
}

export async function updateSubscription(
  admin: SupabaseClient,
  adminEmail: string,
  shopId: string,
  userId: string,
  data: {
    plan?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: string | null;
  }
) {
  const { data: owner } = await admin.auth.admin.getUserById(userId);
  assertNotPlatformAdmin(owner.user?.email);

  const patch: Record<string, unknown> = {};
  if (data.plan != null) patch.plan = data.plan;
  if (data.subscriptionStatus != null) patch.subscription_status = data.subscriptionStatus;
  if (data.subscriptionExpiresAt !== undefined) {
    patch.subscription_expires_at = data.subscriptionExpiresAt;
  }

  const { error } = await admin.from("shops").update(patch).eq("id", shopId);
  if (error) throw error;

  await logAdminAction(admin, adminEmail, "update_subscription", { userId, shopId }, data);
}

export async function inviteWaitlistProspect(
  admin: SupabaseClient,
  adminEmail: string,
  waitlistId: string
) {
  const { data: row, error: fetchErr } = await admin
    .from("waitlist_requests")
    .select("id, email, name, status")
    .eq("id", waitlistId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error("not_found");

  const email = (row as { email: string }).email.trim().toLowerCase();

  const { data: existingUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const alreadyRegistered = existingUsers.users.some(
    (u) => u.email?.trim().toLowerCase() === email
  );
  if (alreadyRegistered) {
    await admin
      .from("waitlist_requests")
      .update({ status: "registered" })
      .eq("id", waitlistId);
    throw new Error("already_registered");
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/login`,
  });
  if (inviteErr) throw inviteErr;

  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from("waitlist_requests")
    .update({
      status: "invited",
      invited_at: now,
      invited_by: adminEmail,
    })
    .eq("id", waitlistId);
  if (updateErr) throw updateErr;

  await logAdminAction(
    admin,
    adminEmail,
    "invite_waitlist",
    {},
    { waitlistId, email, name: (row as { name: string }).name }
  );
}
