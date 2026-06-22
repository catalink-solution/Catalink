import type { SupabaseClient } from "@supabase/supabase-js";
import { planMrr, resolvePlan } from "@/lib/subscription";
import type { AdminStats, AdminUserRow } from "./types";

type ShopRow = {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  plan: string | null;
  subscription_status: string | null;
  is_suspended: boolean;
  subscription_expires_at: string | null;
  created_at: string | null;
};

function isPaidActive(shop: ShopRow): boolean {
  const plan = resolvePlan(shop.plan);
  if (plan === "free") return false;
  const status = shop.subscription_status ?? "active";
  if (status === "expired" || status === "cancelled") return false;
  if (shop.subscription_expires_at && new Date(shop.subscription_expires_at) < new Date()) {
    return false;
  }
  return status === "active" || status === "trialing";
}

function accountStatus(shop: ShopRow | null, banned: boolean): AdminUserRow["accountStatus"] {
  if (banned || shop?.is_suspended) return "suspended";
  if (
    shop &&
    (shop.subscription_status === "expired" ||
      shop.subscription_status === "cancelled" ||
      (shop.subscription_expires_at && new Date(shop.subscription_expires_at) < new Date()))
  ) {
    return "expired";
  }
  return "active";
}

async function listAllAuthUsers(admin: SupabaseClient) {
  const users: { id: string; email?: string; created_at: string; banned_until?: string | null }[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      banned_until: u.banned_until,
    })));
    if (data.users.length < 100) break;
    page++;
  }
  return users;
}

export async function fetchAdminStats(admin: SupabaseClient): Promise<AdminStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, shopsRes, productsRes, ordersRes] = await Promise.all([
    listAllAuthUsers(admin),
    admin.from("shops").select("id, plan, subscription_status, subscription_expires_at"),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id, total, status"),
  ]);

  const shops = (shopsRes.data ?? []) as ShopRow[];
  const orders = (ordersRes.data ?? []) as { id: string; total: number; status: string }[];

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total ?? 0), 0);

  let mrr = 0;
  let activeSubscriptions = 0;
  let expiredSubscriptions = 0;

  for (const shop of shops) {
    const paid = resolvePlan(shop.plan) !== "free";
    const expired =
      shop.subscription_status === "expired" ||
      shop.subscription_status === "cancelled" ||
      (shop.subscription_expires_at && new Date(shop.subscription_expires_at) < new Date());

    if (paid && isPaidActive(shop)) {
      activeSubscriptions++;
      mrr += planMrr(shop.plan);
    } else if (paid && expired) {
      expiredSubscriptions++;
    }
  }

  const newUsers7d = users.filter((u) => u.created_at >= sevenDaysAgo).length;

  return {
    totalUsers: users.length,
    totalShops: shops.length,
    totalProducts: productsRes.count ?? 0,
    totalOrders: orders.length,
    totalRevenue,
    mrr,
    newUsers7d,
    activeSubscriptions,
    expiredSubscriptions,
  };
}

export async function fetchAdminUsers(admin: SupabaseClient): Promise<AdminUserRow[]> {
  const [authUsers, shopsRes, productsRes, ordersRes] = await Promise.all([
    listAllAuthUsers(admin),
    admin.from("shops").select(
      "id, user_id, name, slug, plan, subscription_status, is_suspended, subscription_expires_at, created_at"
    ),
    admin.from("products").select("shop_id"),
    admin.from("orders").select("shop_id, total, status"),
  ]);

  const shops = (shopsRes.data ?? []) as ShopRow[];
  const shopByUser = new Map<string, ShopRow>();
  for (const s of shops) {
    if (s.user_id) shopByUser.set(s.user_id, s);
  }

  const productCount = new Map<string, number>();
  for (const p of (productsRes.data ?? []) as { shop_id: string }[]) {
    productCount.set(p.shop_id, (productCount.get(p.shop_id) ?? 0) + 1);
  }

  const orderStats = new Map<string, { count: number; revenue: number }>();
  for (const o of (ordersRes.data ?? []) as { shop_id: string; total: number; status: string }[]) {
    const cur = orderStats.get(o.shop_id) ?? { count: 0, revenue: 0 };
    cur.count++;
    if (o.status !== "cancelled") cur.revenue += Number(o.total ?? 0);
    orderStats.set(o.shop_id, cur);
  }

  return authUsers
    .map((u) => {
      const shop = shopByUser.get(u.id) ?? null;
      const banned = Boolean(u.banned_until && new Date(u.banned_until) > new Date());
      const stats = shop ? orderStats.get(shop.id) : null;

      return {
        userId: u.id,
        email: u.email ?? "—",
        name: shop?.name ?? u.email?.split("@")[0] ?? "—",
        shopId: shop?.id ?? null,
        shopSlug: shop?.slug ?? null,
        plan: shop?.plan ?? "free",
        subscriptionStatus: shop?.subscription_status ?? "active",
        isSuspended: Boolean(shop?.is_suspended || banned),
        productCount: shop ? productCount.get(shop.id) ?? 0 : 0,
        orderCount: stats?.count ?? 0,
        revenue: stats?.revenue ?? 0,
        createdAt: u.created_at,
        subscriptionExpiresAt: shop?.subscription_expires_at ?? null,
        accountStatus: accountStatus(shop, banned),
      } satisfies AdminUserRow;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function logAdminAction(
  admin: SupabaseClient,
  adminEmail: string,
  action: string,
  target: { userId?: string; shopId?: string },
  metadata?: Record<string, unknown>
) {
  await admin.from("admin_audit_log").insert({
    admin_email: adminEmail,
    action,
    target_user_id: target.userId ?? null,
    target_shop_id: target.shopId ?? null,
    metadata: metadata ?? {},
  });
}
