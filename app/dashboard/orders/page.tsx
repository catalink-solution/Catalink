"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Phone,
  MapPin,
  MessageSquare,
  Truck,
  ExternalLink,
  Check,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/format";
import { CARRIERS, buildTrackingUrl, trackStatusMeta } from "@/lib/tracking";
import {
  ORDER_STATUS,
  ORDER_STATUS_KEYS,
  normalizeStatus,
  isAutoLocked,
  statusMeta,
} from "@/lib/order-status";
import { awardLoyaltyOnDelivery } from "@/lib/loyalty";
import { CustomSelect } from "@/components/ui/custom-select";
import { syncTrackingStatus, isDeliveredStatus } from "@/lib/tracking-sync";
import { getCustomerNotificationType } from "@/lib/customer-order-status";
import type { CustomerNotificationType } from "@/lib/customer-order-status";
import { sellerNotifyHttpError } from "@/lib/order-notify-messages";
import type { Order, OrderItem, TrackingEvent } from "@/lib/types";
import { ContextualTip } from "@/components/dashboard/contextual-tip";

type OrderWithItems = Order & { order_items: OrderItem[] };

type Draft = { carrier: string; number: string };

type CustomerNotifyState = {
  orderId: string;
  messageText: string;
  emailSent: boolean;
  hasCustomerEmail: boolean;
  orderPageUrl: string;
  orderNumber: string;
  orderStatusLabel: string;
  manualFallbackRequired: boolean;
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [shopSlug, setShopSlug] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [eventsByOrder, setEventsByOrder] = useState<Record<string, TrackingEvent[]>>({});
  const [message, setMessage] = useState("");
  const [customerNotify, setCustomerNotify] = useState<CustomerNotifyState | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Tu dois être connecté.");
      setLoading(false);
      return;
    }

    const { data: shop } = await supabase
      .from("shops")
      .select("id, slug")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shop) {
      setMessage("Crée d'abord ta boutique.");
      setLoading(false);
      return;
    }

    setShopSlug(shop.slug);

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);

    const list = (data ?? []) as OrderWithItems[];
    setOrders(list);
    setDrafts(
      Object.fromEntries(
        list.map((o) => [
          o.id,
          { carrier: o.tracking_carrier ?? "", number: o.tracking_number ?? "" },
        ])
      )
    );

    const ids = list.map((o) => o.id);
    if (ids.length > 0) {
      const { data: ev } = await supabase
        .from("tracking_events")
        .select("*")
        .in("order_id", ids)
        .order("event_time", { ascending: false });
      const map: Record<string, TrackingEvent[]> = {};
      for (const e of (ev ?? []) as TrackingEvent[]) {
        (map[e.order_id] ??= []).push(e);
      }
      setEventsByOrder(map);
    }

    setLoading(false);
  }

  function patchOrder(orderId: string, patch: Partial<Order>) {
    setOrders((cur) =>
      cur.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
    );
  }

  async function notifyCustomer(
    order: OrderWithItems,
    notificationType: CustomerNotificationType
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setMessage(sellerNotifyHttpError(401));
      return;
    }

    try {
      const res = await fetch("/api/email/order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id, notificationType }),
      });
      const json = (await res.json()) as {
        error?: string;
        messageText?: string;
        emailSent?: boolean;
        hasCustomerEmail?: boolean;
        orderPageUrl?: string;
        orderNumber?: string;
        orderStatusLabel?: string;
        manualFallbackRequired?: boolean;
      };

      if (!res.ok) {
        setMessage(sellerNotifyHttpError(res.status, json.error));
        return;
      }

      if (!json.messageText) {
        setMessage("Notification client non envoyée : réponse serveur incomplète.");
        return;
      }

      setCustomerNotify({
        orderId: order.id,
        messageText: json.messageText,
        emailSent: Boolean(json.emailSent),
        hasCustomerEmail: Boolean(json.hasCustomerEmail),
        orderPageUrl: json.orderPageUrl ?? "",
        orderNumber: json.orderNumber ?? order.id.slice(0, 8).toUpperCase(),
        orderStatusLabel: json.orderStatusLabel ?? statusMeta(order.status).label,
        manualFallbackRequired: Boolean(json.manualFallbackRequired),
      });
    } catch {
      setMessage("Notification client non envoyée : erreur réseau.");
    }
  }

  async function updateStatus(orderId: string, status: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const previousStatus = order.status;
    const patch: Partial<Order> = { status };
    const now = new Date().toISOString();
    if (status === "shipped" && !order.shipped_at) patch.shipped_at = now;
    if (status === "delivered" && !order.delivered_at) patch.delivered_at = now;

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) {
      setMessage("Erreur mise à jour : " + error.message);
      return;
    }

    patchOrder(orderId, patch);

    if (status === "delivered") {
      await awardLoyaltyOnDelivery(supabase, orderId);
    }
    const notifyType = getCustomerNotificationType(previousStatus, status);
    if (notifyType) {
      await notifyCustomer({ ...order, ...patch }, notifyType);
    }
  }

  async function saveTracking(orderId: string) {
    const draft = drafts[orderId] ?? { carrier: "", number: "" };
    const number = draft.number.trim();
    const order = orders.find((o) => o.id === orderId);

    const patch: Partial<Order> = {
      tracking_number: number || null,
      tracking_carrier: draft.carrier || null,
    };

    // Renseigner un numéro de suivi = la commande est expédiée.
    // On ne force jamais une commande annulée ou déjà livrée.
    if (number && order && !isAutoLocked(order.status)) {
      patch.status = "shipped";
      if (!order.shipped_at) patch.shipped_at = new Date().toISOString();
    }

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) {
      setMessage("Erreur suivi : " + error.message);
      return;
    }

    const previousStatus = order?.status;
    patchOrder(orderId, patch);
    setSavedId(orderId);
    setTimeout(() => setSavedId((id) => (id === orderId ? null : id)), 2000);

    if (order && patch.status === "shipped") {
      const notifyType = getCustomerNotificationType(previousStatus, "shipped");
      if (notifyType) {
        await notifyCustomer({ ...order, ...patch }, notifyType);
      }
    }

    if (number) refreshStatus(orderId, number);
  }

  // 17TRACK sync: fetch the live delivery status and apply the auto rules.
  async function refreshStatus(orderId: string, trackingNumber?: string) {
    const number = (trackingNumber ?? "").trim();
    if (!number) return;
    setRefreshingId(orderId);
    setMessage("");

    const result = await syncTrackingStatus(number);
    setRefreshingId(null);

    if (!result.ok) {
      setMessage(
        result.configured
          ? result.error ?? "Erreur 17track."
          : "Suivi manuel uniquement — clé 17track non configurée."
      );
      return;
    }

    const order = orders.find((o) => o.id === orderId);
    const previousStatus = order?.status;
    const patch: Partial<Order> = {
      tracking_status: result.trackingStatus,
      tracking_status_at: new Date().toISOString(),
      tracking_last_event: result.latestEvent,
      tracking_last_event_at: result.latestEventAt,
    };

    // 17track confirme la livraison → statut "Livrée" (sauf commande verrouillée).
    if (isDeliveredStatus(result.trackingStatus) && order && !isAutoLocked(order.status)) {
      patch.status = "delivered";
      if (!order.delivered_at) patch.delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (updateError) {
      setMessage("Erreur mise à jour : " + updateError.message);
      return;
    }

    patchOrder(orderId, patch);

    if (patch.status === "delivered") {
      await awardLoyaltyOnDelivery(supabase, orderId);
    }

    const nextStatus = patch.status ?? previousStatus ?? "new";
    const notifyType = getCustomerNotificationType(previousStatus, nextStatus);
    if (notifyType && order) {
      await notifyCustomer({ ...order, ...patch }, notifyType);
    }

    // Historique des événements transporteur : on remplace l'existant.
    if (result.events.length > 0) {
      await supabase.from("tracking_events").delete().eq("order_id", orderId);
      const rows = result.events.map((e) => ({
        order_id: orderId,
        status: e.status,
        description: e.description,
        location: e.location,
        event_time: e.time,
      }));
      const { data: inserted } = await supabase
        .from("tracking_events")
        .insert(rows)
        .select("*");
      const stored = ((inserted ?? rows) as TrackingEvent[])
        .slice()
        .sort((a, b) => (b.event_time ?? "").localeCompare(a.event_time ?? ""));
      setEventsByOrder((cur) => ({ ...cur, [orderId]: stored }));
    }

    if (result.note) setMessage(result.note);
  }

  function setDraft(orderId: string, partial: Partial<Draft>) {
    setDrafts((cur) => ({
      ...cur,
      [orderId]: { ...(cur[orderId] ?? { carrier: "", number: "" }), ...partial },
    }));
  }

  const visible =
    filter === "all"
      ? orders
      : orders.filter((o) => normalizeStatus(o.status) === filter);

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Commandes</h1>
        <span className="text-sm text-white/40">{orders.length} commande(s)</span>
      </div>

      <ContextualTip page="orders" />

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {customerNotify && (
        <div className="mb-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
          <p className="text-sm font-semibold text-violet-200">
            {customerNotify.emailSent
              ? `Email envoyé au client (commande #${customerNotify.orderNumber}).`
              : customerNotify.manualFallbackRequired
                ? "Email non envoyé automatiquement. Copiez ce message et envoyez-le au client."
                : "Pas d'email client — envoie ce message manuellement :"}
          </p>
          <p className="mt-1 text-xs text-white/50">
            Commande #{customerNotify.orderNumber} · Statut : {customerNotify.orderStatusLabel}
          </p>
          {!customerNotify.emailSent && (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs text-white/80">
              {customerNotify.messageText}
            </pre>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!customerNotify.emailSent && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(customerNotify.messageText);
                  setMessage("Message copié.");
                  setTimeout(() => setMessage(""), 3000);
                }}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold hover:bg-violet-500"
              >
                Copier le message
              </button>
            )}
            {customerNotify.orderPageUrl && (
              <a
                href={customerNotify.orderPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/5"
              >
                Page suivi client
              </a>
            )}
            <button
              type="button"
              onClick={() => setCustomerNotify(null)}
              className="rounded-lg px-3 py-1.5 text-xs text-white/50 hover:text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", ...ORDER_STATUS_KEYS].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {key === "all" ? "Toutes" : ORDER_STATUS[key].label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 py-16 text-center">
          <Inbox size={40} className="text-white/20" />
          <p className="mt-4 text-white/50">Aucune commande pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => {
            const statusKey = normalizeStatus(order.status);
            const status = statusMeta(order.status);
            const draft = drafts[order.id] ?? { carrier: "", number: "" };
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white/40">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      {formatDate(order.created_at)}
                      {shopSlug && (
                        <>
                          {" · "}
                          <a
                            href={`/${shopSlug}/order/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-300 hover:text-violet-200"
                          >
                            Page client
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold">{formatPrice(order.total)}</p>
                    <CustomSelect
                      value={statusKey}
                      onChange={(v) => updateStatus(order.id, v)}
                      size="sm"
                      options={ORDER_STATUS_KEYS.map((k) => ({
                        value: k,
                        label: ORDER_STATUS[k].label,
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Customer */}
                <div className="mt-4 grid gap-2 border-t border-white/[0.06] pt-4 text-sm sm:grid-cols-2">
                  <p className="font-semibold">{order.customer_name}</p>
                  {order.customer_contact && (
                    <p className="flex items-center gap-2 text-white/60">
                      <Phone size={14} /> {order.customer_contact}
                    </p>
                  )}
                  {order.customer_address && (
                    <p className="flex items-center gap-2 text-white/60">
                      <MapPin size={14} /> {order.customer_address}
                    </p>
                  )}
                  {order.message && (
                    <p className="flex items-start gap-2 text-white/60 sm:col-span-2">
                      <MessageSquare size={14} className="mt-0.5 shrink-0" /> {order.message}
                    </p>
                  )}
                </div>

                {/* Items */}
                <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4">
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-3 text-sm text-white/70"
                    >
                      <span>
                        <span className="font-medium text-white">{item.quantity}×</span>{" "}
                        {item.product_name}
                        {item.variant_label ? (
                          <span className="text-white/40"> ({item.variant_label})</span>
                        ) : (
                          item.size && <span className="text-white/40"> ({item.size})</span>
                        )}
                      </span>
                      <span className="whitespace-nowrap">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tracking / shipping */}
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                    <Truck size={14} /> Suivi de livraison
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="block">
                      <span className="mb-1 block text-xs text-white/50">Transporteur</span>
                      <CustomSelect
                        value={draft.carrier}
                        onChange={(v) => setDraft(order.id, { carrier: v })}
                        size="sm"
                        placeholder="—"
                        options={[
                          { value: "", label: "—" },
                          ...CARRIERS.map((c) => ({ value: c, label: c })),
                        ]}
                      />
                    </label>

                    <label className="block min-w-[180px] flex-1">
                      <span className="mb-1 block text-xs text-white/50">Numéro de suivi</span>
                      <input
                        value={draft.number}
                        onChange={(e) => setDraft(order.id, { number: e.target.value })}
                        placeholder="Ex : 1Z999AA10123456784"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
                      />
                    </label>

                    <button
                      onClick={() => saveTracking(order.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
                    >
                      {savedId === order.id ? <Check size={15} /> : null}
                      {savedId === order.id ? "Enregistré" : "Enregistrer"}
                    </button>

                    {order.tracking_number && (
                      <button
                        onClick={() => refreshStatus(order.id, order.tracking_number ?? "")}
                        disabled={refreshingId === order.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={15}
                          className={refreshingId === order.id ? "animate-spin" : ""}
                        />
                        {refreshingId === order.id ? "Maj…" : "Rafraîchir le statut"}
                      </button>
                    )}

                    {order.tracking_number && (
                      <a
                        href={buildTrackingUrl(order.tracking_carrier, order.tracking_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        <ExternalLink size={15} /> Voir le suivi
                      </a>
                    )}
                  </div>

                  {order.tracking_number && (
                    <div className="mt-3 space-y-1.5 rounded-xl bg-white/[0.03] p-3 text-sm">
                      <p className="text-white/60">
                        <span className="text-white/40">Transporteur :</span>{" "}
                        {order.tracking_carrier || "—"}
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Numéro de suivi :</span>{" "}
                        <span className="font-mono text-white/80">{order.tracking_number}</span>
                      </p>
                      <p className="flex flex-wrap items-center gap-2 text-white/60">
                        <span className="text-white/40">Statut livraison :</span>
                        {order.tracking_status ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              trackStatusMeta(order.tracking_status).cls
                            }`}
                          >
                            {trackStatusMeta(order.tracking_status).label}
                          </span>
                        ) : (
                          <span className="text-white/40">Non synchronisé</span>
                        )}
                        {order.tracking_status_at && (
                          <span className="text-xs text-white/30">
                            maj {formatDate(order.tracking_status_at)}
                          </span>
                        )}
                      </p>
                      {order.tracking_last_event && (
                        <p className="text-white/60">
                          <span className="text-white/40">Dernier événement :</span>{" "}
                          {order.tracking_last_event}
                          {order.tracking_last_event_at && (
                            <span className="text-xs text-white/30">
                              {" "}
                              · {formatDate(order.tracking_last_event_at)}
                            </span>
                          )}
                        </p>
                      )}
                      {(eventsByOrder[order.id]?.length ?? 0) > 0 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs font-medium text-violet-300 hover:text-violet-200">
                            Historique du suivi ({eventsByOrder[order.id].length})
                          </summary>
                          <ul className="mt-2 space-y-2 border-l border-white/10 pl-3">
                            {eventsByOrder[order.id].map((e, i) => (
                              <li key={e.id ?? i} className="text-xs text-white/50">
                                <span className="text-white/70">
                                  {e.description ?? e.status ?? "—"}
                                </span>
                                {e.location && <span> · {e.location}</span>}
                                {e.event_time && (
                                  <span className="block text-white/30">
                                    {formatDate(e.event_time)}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {(order.shipped_at || order.delivered_at) && (
                        <p className="text-xs text-white/30">
                          {order.shipped_at && `Expédiée le ${formatDate(order.shipped_at)}`}
                          {order.shipped_at && order.delivered_at && " · "}
                          {order.delivered_at && `Livrée le ${formatDate(order.delivered_at)}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm text-white/40 hover:text-white">
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
