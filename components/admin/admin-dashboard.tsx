"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  Euro,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { planLabel, SUBSCRIPTION_STATUS_LABELS, type SubscriptionStatus } from "@/lib/subscription";
import type { AdminStats, AdminUserRow } from "@/lib/admin/types";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function adminFetch(path: string, init?: RequestInit) {
  const token = await getToken();
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<AdminUserRow["accountStatus"], string> = {
  active: "bg-green-500/15 text-green-300",
  suspended: "bg-red-500/15 text-red-300",
  expired: "bg-amber-500/15 text-amber-300",
};

const STATUS_LABEL: Record<AdminUserRow["accountStatus"], string> = {
  active: "Actif",
  suspended: "Suspendu",
  expired: "Expiré",
};

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [editPlan, setEditPlan] = useState("free");
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>("active");
  const [editExpires, setEditExpires] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statsRes, usersRes] = await Promise.all([
      adminFetch("/api/admin/stats"),
      adminFetch("/api/admin/users"),
    ]);
    if (!statsRes.ok || !usersRes.ok) {
      setError("Impossible de charger les données admin.");
      setLoading(false);
      return;
    }
    const statsJson = await statsRes.json();
    const usersJson = await usersRes.json();
    setStats(statsJson.stats);
    setUsers(usersJson.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function userAction(user: AdminUserRow, action: string, extra?: Record<string, unknown>) {
    setBusyId(user.userId);
    const res = await adminFetch(`/api/admin/users/${user.userId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, shopId: user.shopId, ...extra }),
    });
    setBusyId(null);
    if (!res.ok) {
      setError("Action échouée.");
      return;
    }
    await load();
  }

  function openEdit(user: AdminUserRow) {
    setEditUser(user);
    setEditPlan(user.plan);
    setEditStatus((user.subscriptionStatus as SubscriptionStatus) || "active");
    setEditExpires(user.subscriptionExpiresAt?.slice(0, 10) ?? "");
  }

  async function saveSubscription() {
    if (!editUser?.shopId) return;
    await userAction(editUser, "update_subscription", {
      plan: editPlan,
      subscriptionStatus: editStatus,
      subscriptionExpiresAt: editExpires || null,
    });
    setEditUser(null);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/50">
        <Loader2 className="animate-spin" size={20} /> Chargement…
      </div>
    );
  }

  if (error && !stats) {
    return <p className="text-red-300">{error}</p>;
  }

  const kpis = stats
    ? [
        { label: "Utilisateurs", value: stats.totalUsers, icon: Users },
        { label: "Boutiques", value: stats.totalShops, icon: Store },
        { label: "Produits", value: stats.totalProducts, icon: Package },
        { label: "Commandes", value: stats.totalOrders, icon: ShoppingCart },
        { label: "CA total", value: formatEuro(stats.totalRevenue), icon: Euro },
        { label: "MRR", value: formatEuro(stats.mrr), icon: TrendingUp },
        { label: "Nouveaux (7j)", value: stats.newUsers7d, icon: UserPlus },
        { label: "Abonnements actifs", value: stats.activeSubscriptions, icon: CheckCircle2 },
        { label: "Abonnements expirés", value: stats.expiredSubscriptions, icon: XCircle },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Vue plateforme</h1>
        <p className="mt-1 text-white/50">KPIs globaux et gestion des comptes vendeurs.</p>
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-white/40">{k.label}</span>
                <Icon size={18} className="text-white/30" />
              </div>
              <p className="text-2xl font-bold">{k.value}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold">Utilisateurs ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Abonnement</th>
                <th className="px-4 py-3">Produits</th>
                <th className="px-4 py-3">Commandes</th>
                <th className="px-4 py-3">CA</th>
                <th className="px-4 py-3">Inscription</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-white/70">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200">
                      {planLabel(u.plan)}
                    </span>
                    <span className="ml-1 text-xs text-white/40">
                      {SUBSCRIPTION_STATUS_LABELS[u.subscriptionStatus as SubscriptionStatus] ??
                        u.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.productCount}</td>
                  <td className="px-4 py-3">{u.orderCount}</td>
                  <td className="px-4 py-3">{formatEuro(u.revenue)}</td>
                  <td className="px-4 py-3 text-white/60">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[u.accountStatus]}`}>
                      {STATUS_LABEL[u.accountStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.shopSlug && (
                        <a
                          href={`/${u.shopSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5"
                          title="Voir la boutique"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {u.accountStatus === "suspended" ? (
                        <button
                          type="button"
                          disabled={busyId === u.userId}
                          onClick={() => userAction(u, "activate")}
                          className="rounded-lg border border-green-500/30 px-2 py-1 text-xs text-green-300 hover:bg-green-500/10 disabled:opacity-40"
                        >
                          Activer
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === u.userId}
                          onClick={() => userAction(u, "suspend")}
                          className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                        >
                          Suspendre
                        </button>
                      )}
                      {u.shopId && (
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                        >
                          <MoreHorizontal size={14} className="inline" /> Plan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditUser(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1117] p-6">
            <h3 className="text-lg font-bold">Modifier l&apos;abonnement</h3>
            <p className="mt-1 text-sm text-white/50">{editUser.email}</p>
            <select
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm"
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value)}
            >
              <option value="free">Free</option>
              <option value="pro">Pro (49€/mois)</option>
              <option value="business">Business (99€/mois)</option>
            </select>
            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as SubscriptionStatus)}
            >
              {(Object.keys(SUBSCRIPTION_STATUS_LABELS) as SubscriptionStatus[]).map((s) => (
                <option key={s} value={s}>
                  {SUBSCRIPTION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-xs text-white/50">Expiration (optionnel)</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm"
              value={editExpires}
              onChange={(e) => setEditExpires(e.target.value)}
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={saveSubscription}
                className="flex-1 rounded-xl bg-violet-600 py-2.5 font-semibold hover:bg-violet-500"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 hover:bg-white/5"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
