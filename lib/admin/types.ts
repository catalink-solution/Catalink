export type AdminStats = {
  totalUsers: number;
  totalShops: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  mrr: number;
  newUsers7d: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  waitlistCount: number;
  waitlistPending: number;
  waitlistInvited: number;
};

export type WaitlistStatus = "pending" | "invited" | "registered" | "declined";

export type AdminWaitlistRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneNormalized: string | null;
  shopName: string;
  channel: string;
  channelOther: string | null;
  status: WaitlistStatus;
  invitedAt: string | null;
  invitedBy: string | null;
  createdAt: string;
};

export type AdminUserRow = {
  userId: string;
  email: string;
  name: string;
  shopId: string | null;
  shopSlug: string | null;
  plan: string;
  subscriptionStatus: string;
  isSuspended: boolean;
  orderCount: number;
  revenue: number;
  createdAt: string;
  subscriptionExpiresAt: string | null;
  accountStatus: "active" | "suspended" | "expired";
  isProtectedAdmin: boolean;
  role: "platform_admin" | "vendor";
  /** Total produits en base (tous statuts). */
  productCount: number;
  /** Produits is_active=true (visibles storefront). */
  visibleProductCount: number;
};

export type SubscriptionUpdate = {
  plan?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
};
