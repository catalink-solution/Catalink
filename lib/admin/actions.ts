import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "./queries";

const BAN_DURATION = "876000h"; // ~100 ans

export async function suspendUser(
  admin: SupabaseClient,
  adminEmail: string,
  userId: string,
  shopId: string | null
) {
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
