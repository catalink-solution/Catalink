import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "./queries";
import {
  assertNotPlatformAdmin,
  CANNOT_DELETE_SELF,
  USER_HAS_ORDERS,
} from "./protection";
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

export class UserDeleteBlockedError extends Error {
  constructor(public code: typeof CANNOT_DELETE_SELF | typeof USER_HAS_ORDERS) {
    super(code);
    this.name = "UserDeleteBlockedError";
  }
}

async function deleteShopData(admin: SupabaseClient, shopId: string, userId: string) {
  const { data: products } = await admin.from("products").select("id").eq("shop_id", shopId);
  const productIds = (products ?? []).map((p) => p.id as string);

  if (productIds.length > 0) {
    const { data: skus } = await admin.from("product_skus").select("id").in("product_id", productIds);
    const skuIds = (skus ?? []).map((s) => s.id as string);

    if (skuIds.length > 0) {
      await admin.from("product_sku_values").delete().in("sku_id", skuIds);
      await admin.from("product_sku_images").delete().in("sku_id", skuIds);
    }
    await admin.from("product_skus").delete().in("product_id", productIds);

    const { data: attributes } = await admin
      .from("product_attributes")
      .select("id")
      .in("product_id", productIds);
    const attributeIds = (attributes ?? []).map((a) => a.id as string);
    if (attributeIds.length > 0) {
      await admin.from("product_attribute_values").delete().in("attribute_id", attributeIds);
    }
    await admin.from("product_attributes").delete().in("product_id", productIds);

    await admin.from("product_images").delete().in("product_id", productIds);
    await admin.from("product_variants").delete().in("product_id", productIds);
    await admin.from("reviews").delete().in("product_id", productIds);
    await admin.from("products").delete().eq("shop_id", shopId);
  }

  await admin.from("reviews").delete().eq("shop_id", shopId);
  await admin.from("story_exports").delete().eq("shop_id", shopId);
  await admin.from("story_templates").delete().eq("shop_id", shopId);
  await admin.from("quick_replies").delete().eq("shop_id", shopId);
  await admin.from("campaign_visits").delete().eq("shop_id", shopId);
  await admin.from("campaign_links").delete().eq("shop_id", shopId);
  await admin.from("abandoned_carts").delete().eq("shop_id", shopId);
  await admin.from("customer_loyalty").delete().eq("shop_id", shopId);
  await admin.from("customers").delete().eq("shop_id", shopId);
  await admin.from("product_categories").delete().eq("shop_id", shopId);

  const { data: jobs } = await admin.from("import_jobs").select("id").eq("shop_id", shopId);
  const jobIds = (jobs ?? []).map((j) => j.id as string);
  if (jobIds.length > 0) {
    await admin.from("import_files").delete().in("job_id", jobIds);
    await admin.from("import_detected_variants").delete().in("job_id", jobIds);
    await admin.from("import_detected_products").delete().in("job_id", jobIds);
    await admin.from("import_processing_logs").delete().in("job_id", jobIds);
    await admin.from("import_jobs").delete().in("id", jobIds);
  }

  await admin.from("notifications").delete().or(`shop_id.eq.${shopId},user_id.eq.${userId}`);
  await admin.from("shops").delete().eq("id", shopId);
}

export async function deleteUser(
  admin: SupabaseClient,
  adminEmail: string,
  actingAdminUserId: string,
  userId: string
) {
  if (actingAdminUserId === userId) {
    throw new UserDeleteBlockedError(CANNOT_DELETE_SELF);
  }

  const { data: targetData, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr) throw userErr;
  if (!targetData.user) throw new Error("not_found");

  assertNotPlatformAdmin(targetData.user.email);
  const deletedEmail = (targetData.user.email ?? "").trim().toLowerCase();

  const { data: shops } = await admin.from("shops").select("id").eq("user_id", userId);
  const shopIds = (shops ?? []).map((s) => s.id as string);

  let orderCount = 0;
  let revenue = 0;
  let productCount = 0;

  if (shopIds.length > 0) {
    const [{ data: orders }, { data: products }] = await Promise.all([
      admin.from("orders").select("total, status").in("shop_id", shopIds),
      admin.from("products").select("id").in("shop_id", shopIds),
    ]);

    orderCount = orders?.length ?? 0;
    revenue = (orders ?? [])
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0);
    productCount = products?.length ?? 0;

    if (orderCount > 0 || revenue > 0) {
      throw new UserDeleteBlockedError(USER_HAS_ORDERS);
    }

    for (const shopId of shopIds) {
      await deleteShopData(admin, shopId, userId);
    }
  }

  await admin.from("notifications").delete().eq("user_id", userId);

  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) throw deleteErr;

  if (deletedEmail) {
    await admin
      .from("waitlist_requests")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        declined_by: adminEmail,
      })
      .eq("email", deletedEmail);
  }

  await logAdminAction(
    admin,
    adminEmail,
    "delete_user",
    { userId, shopId: shopIds[0] },
    {
      deleted_user_id: userId,
      deleted_email: deletedEmail,
      deleted_shop_count: shopIds.length,
      deleted_product_count: productCount,
      deleted_order_count: orderCount,
      deleted_by: adminEmail,
    }
  );
}
