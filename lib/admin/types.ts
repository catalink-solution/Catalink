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
};

export type WaitlistStatus = "pending" | "invited" | "registered";

export type AdminWaitlistRow = {
  id: string;
  name: string;
  email: string;
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
  productCount: number;
  orderCount: number;
  revenue: number;
  createdAt: string;
  subscriptionExpiresAt: string | null;
  accountStatus: "active" | "suspended" | "expired";
};

export type SubscriptionUpdate = {
  plan?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
};
