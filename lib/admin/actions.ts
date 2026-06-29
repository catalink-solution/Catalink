import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "./queries";
import { assertNotPlatformAdmin } from "./protection";
import {
  authUserByEmail,
  getInviteRedirectUrl,
  isWaitlistProspectRegistered,
  listAllAuthUsersLite,
} from "./waitlist-auth";

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

type WaitlistRow = {
  id: string;
  email: string;
  name: string;
  shop_name: string;
  phone: string | null;
  status: string;
};

export async function inviteWaitlistProspect(
  admin: SupabaseClient,
  adminEmail: string,
  waitlistId: string
) {
  const { data: row, error: fetchErr } = await admin
    .from("waitlist_requests")
    .select("id, email, name, shop_name, phone, status")
    .eq("id", waitlistId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error("not_found");

  const typed = row as WaitlistRow;
  if (typed.status === "declined") throw new Error("declined");

  const email = typed.email.trim().toLowerCase();
  const authUsers = await listAllAuthUsersLite(admin);
  const byEmail = authUserByEmail(authUsers);
  const authUser = byEmail.get(email);

  if (isWaitlistProspectRegistered(authUser)) {
    await admin.from("waitlist_requests").update({ status: "registered" }).eq("id", waitlistId);
    throw new Error("already_registered");
  }

  const redirectTo = getInviteRedirectUrl();
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (inviteErr) {
    console.error("[waitlist] inviteUserByEmail failed:", inviteErr);
    throw new Error("invite_email_failed");
  }

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
    {
      waitlistId,
      email,
      name: typed.name,
      shop_name: typed.shop_name,
      phone: typed.phone,
      invited_by: adminEmail,
      invited_at: now,
    }
  );
}

export async function declineWaitlistProspect(
  admin: SupabaseClient,
  adminEmail: string,
  waitlistId: string
) {
  const { data: row, error: fetchErr } = await admin
    .from("waitlist_requests")
    .select("id, email, shop_name, phone, status")
    .eq("id", waitlistId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error("not_found");

  const typed = row as WaitlistRow;
  if (typed.status === "declined") return;

  const previousStatus = typed.status;
  const now = new Date().toISOString();

  const { error: updateErr } = await admin
    .from("waitlist_requests")
    .update({
      status: "declined",
      declined_at: now,
      declined_by: adminEmail,
    })
    .eq("id", waitlistId);
  if (updateErr) throw updateErr;

  await logAdminAction(
    admin,
    adminEmail,
    "decline_waitlist",
    {},
    {
      waitlistId,
      email: typed.email,
      shop_name: typed.shop_name,
      phone: typed.phone,
      previous_status: previousStatus,
      declined_by: adminEmail,
      declined_at: now,
    }
  );
}
