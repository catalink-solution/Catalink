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
  ClipboardList,
  Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { planLabel, SUBSCRIPTION_STATUS_LABELS, type SubscriptionStatus } from "@/lib/subscription";
import type { AdminStats, AdminUserRow, AdminWaitlistRow, WaitlistStatus } from "@/lib/admin/types";
import { whatsAppUrl } from "@/lib/waitlist-phone";
import { CustomSelect } from "@/components/ui/custom-select";

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

const WAITLIST_STATUS_LABEL: Record<WaitlistStatus, string> = {
  pending: "En attente",
  invited: "Invité",
  registered: "Inscrit",
  declined: "Décliné",
};

const WAITLIST_STATUS_BADGE: Record<WaitlistStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  invited: "bg-blue-500/15 text-blue-300",
  registered: "bg-green-500/15 text-green-300",
  declined: "bg-red-500/15 text-red-300",
};

const CHANNEL_LABEL: Record<string, string> = {
  snapchat: "Snapchat",
  telegram: "Telegram",
  tiktok: "TikTok",
  instagram: "Instagram",
  other: "Autre",
};

function channelLabel(channel: string, other: string | null) {
  if (channel === "other" && other) return other;
  return CHANNEL_LABEL[channel] ?? channel;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [waitlist, setWaitlist] = useState<AdminWaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyWaitlistId, setBusyWaitlistId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [editPlan, setEditPlan] = useState("free");
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>("active");
  const [editExpires, setEditExpires] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statsRes, usersRes, waitlistRes] = await Promise.all([
      adminFetch("/api/admin/stats"),
      adminFetch("/api/admin/users"),
      adminFetch("/api/admin/waitlist"),
    ]);
    if (!statsRes.ok || !usersRes.ok || !waitlistRes.ok) {
      setError("Impossible de charger les données admin.");
      setLoading(false);
      return;
    }
    const statsJson = await statsRes.json();
    const usersJson = await usersRes.json();
    const waitlistJson = await waitlistRes.json();
    setStats(statsJson.stats);
    setUsers(usersJson.users);
    setWaitlist(waitlistJson.waitlist);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  async function userAction(user: AdminUserRow, action: string, extra?: Record<string, unknown>) {
    setBusyId(user.userId);
    setError(null);
    setNotice(null);
    const res = await adminFetch(`/api/admin/users/${user.userId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, shopId: user.shopId, ...extra }),
    });
    setBusyId(null);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 403 && json.error === "cannot_modify_platform_admin") {
        setError("Ce compte administrateur plateforme est protégé.");
      } else {
        setError("Action échouée.");
      }
      return;
    }
    await load();
  }

  async function deleteUserAccount(user: AdminUserRow) {
    const ok = window.confirm(
      "Supprimer définitivement cet utilisateur ? Cette action est irréversible."
    );
    if (!ok) return;

    setBusyId(user.userId);
    setError(null);
    setNotice(null);
    const res = await adminFetch(`/api/admin/users/${user.userId}`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (json.error === "cannot_modify_platform_admin" || json.error === "cannot_delete_self") {
        setError("Cet utilisateur ne peut pas être supprimé.");
      } else if (json.error === "user_has_orders") {
        setError("Impossible de supprimer un utilisateur avec des commandes. Suspends-le plutôt.");
      } else {
        setError("Suppression impossible. Réessaie.");
      }
      return;
    }

    setNotice("Utilisateur supprimé.");
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

  async function inviteProspect(row: AdminWaitlistRow) {
    setBusyWaitlistId(row.id);
    setError(null);
    setNotice(null);
    const res = await adminFetch(`/api/admin/waitlist/${row.id}/invite`, { method: "POST" });
    setBusyWaitlistId(null);

    if (res.status === 409) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        json.error === "already_registered"
          ? "Ce prospect a déjà un compte Catalink actif."
          : "Action impossible pour ce prospect."
      );
      await load();
      return;
    }
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      setError(
        json.error === "invite_email_failed"
          ? "L'email d'invitation n'a pas pu être envoyé. Vérifie Supabase Auth."
          : json.message ?? "Invitation échouée."
      );
      return;
    }
    setNotice("Invitation envoyée par email.");
    await load();
  }

  async function declineProspect(row: AdminWaitlistRow) {
    const ok = window.confirm(
      "Refuser cette demande ? Le prospect sera retiré de la liste d'attente."
    );
    if (!ok) return;

    setBusyWaitlistId(row.id);
    setError(null);
    setNotice(null);
    const res = await adminFetch(`/api/admin/waitlist/${row.id}/decline`, { method: "POST" });
    setBusyWaitlistId(null);

    if (!res.ok) {
      setError("Impossible de décliner cette demande.");
      return;
    }
    setNotice("Demande déclinée.");
    await load();
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
        { label: "Waitlist", value: stats.waitlistCount, icon: ClipboardList },
        { label: "Waitlist en attente", value: stats.waitlistPending, icon: Mail },
        { label: "Invités", value: stats.waitlistInvited, icon: UserPlus },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Vue plateforme</h1>
        <p className="mt-1 text-white/50">KPIs globaux et gestion des comptes vendeurs.</p>
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}
      {notice && <p className="rounded-xl bg-green-500/10 px-4 py-2 text-sm text-green-300">{notice}</p>}

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
          <h2 className="text-lg font-bold">Liste d&apos;attente ({waitlist.length})</h2>
          <p className="mt-1 text-sm text-white/40">
            Demandes d&apos;accès — invite un prospect pour lui créer un compte par email.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/40">
                    Aucune demande pour le moment.
                  </td>
                </tr>
              ) : (
                waitlist.map((w) => (
                  <tr key={w.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3 text-white/70">{w.email}</td>
                    <td className="px-4 py-3 text-white/70">
                      {w.phone ? (
                        (() => {
                          const wa = whatsAppUrl(w.phoneNormalized ?? w.phone);
                          return wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-300 hover:text-green-200"
                            >
                              {w.phone}
                            </a>
                          ) : (
                            w.phone
                          );
                        })()
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{w.shopName}</td>
                    <td className="px-4 py-3 text-white/60">
                      {channelLabel(w.channel, w.channelOther)}
                    </td>
                    <td className="px-4 py-3 text-white/60">{formatDate(w.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${WAITLIST_STATUS_BADGE[w.status]}`}
                      >
                        {WAITLIST_STATUS_LABEL[w.status]}
                      </span>
                      {w.invitedAt && (
                        <p className="mt-0.5 text-xs text-white/30">
                          Invité {formatDate(w.invitedAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {w.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={busyWaitlistId === w.id}
                              onClick={() => inviteProspect(w)}
                              className="rounded-lg border border-violet-500/40 px-2 py-1 text-xs text-violet-300 hover:bg-violet-500/10 disabled:opacity-40"
                            >
                              {busyWaitlistId === w.id ? "Envoi…" : "Inviter ce prospect"}
                            </button>
                            <button
                              type="button"
                              disabled={busyWaitlistId === w.id}
                              onClick={() => declineProspect(w)}
                              className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                            >
                              Décliner
                            </button>
                          </>
                        )}
                        {w.status === "invited" && (
                          <button
                            type="button"
                            disabled={busyWaitlistId === w.id}
                            onClick={() => inviteProspect(w)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 hover:bg-white/5 disabled:opacity-40"
                          >
                            Renvoyer l&apos;invitation
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                    {u.isProtectedAdmin ? (
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-200">
                        Admin plateforme
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200">
                          {planLabel(u.plan)}
                        </span>
                        <span className="ml-1 text-xs text-white/40">
                          {SUBSCRIPTION_STATUS_LABELS[u.subscriptionStatus as SubscriptionStatus] ??
                            u.subscriptionStatus}
                        </span>
                      </>
                    )}
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
                      {u.isProtectedAdmin ? (
                        <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-300">
                          Protégé
                        </span>
                      ) : (
                        <>
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
                          {u.userId !== currentUserId && (
                            <button
                              type="button"
                              disabled={busyId === u.userId}
                              onClick={() => deleteUserAccount(u)}
                              className="rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                            >
                              Supprimer
                            </button>
                          )}
                        </>
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
            <CustomSelect
              value={editPlan}
              onChange={setEditPlan}
              className="mt-4"
              options={[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro (49€/mois)" },
                { value: "business", label: "Business (99€/mois)" },
              ]}
            />
            <CustomSelect
              value={editStatus}
              onChange={(v) => setEditStatus(v as SubscriptionStatus)}
              className="mt-3"
              options={(Object.keys(SUBSCRIPTION_STATUS_LABELS) as SubscriptionStatus[]).map((s) => ({
                value: s,
                label: SUBSCRIPTION_STATUS_LABELS[s],
              }))}
            />
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
