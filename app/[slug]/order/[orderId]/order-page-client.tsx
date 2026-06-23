"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  MessageCircle,
  Package,
  Truck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/format";
import { formatOrderNumber, customerStatusLabel } from "@/lib/customer-order-status";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp-order";
import { buildTrackingUrl } from "@/lib/tracking";
import { OrderTimeline } from "@/components/storefront/order-timeline";

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  variant_label: string | null;
};

type CustomerOrder = {
  order_id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  status: string;
  total: number;
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_last_event: string | null;
  items: OrderItem[];
};

type ShopInfo = { name: string; whatsapp: string | null };

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = use(params);
  const searchParams = useSearchParams();
  const whatsappRedirect = searchParams.get("whatsapp") === "1";

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waError, setWaError] = useState<string | null>(null);
  const [waRedirecting, setWaRedirecting] = useState(false);
  const waAttempted = useRef(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [shopRes, orderRes] = await Promise.all([
      supabase
        .from("shops_storefront")
        .select("name, whatsapp, is_suspended")
        .eq("slug", slug)
        .maybeSingle(),
      supabase.rpc("get_order_for_customer", {
        p_shop_slug: slug,
        p_order_ref: orderId,
      }),
    ]);

    if (shopRes.data) {
      setShop({
        name: shopRes.data.name,
        whatsapp: shopRes.data.whatsapp,
      });
    }

    if (orderRes.error) {
      const msg = orderRes.error.message;
      if (msg.includes("order_not_found")) {
        setError("Commande introuvable. Vérifie le lien ou le numéro de commande.");
      } else if (msg.includes("shop_not_found")) {
        setError("Boutique introuvable.");
      } else {
        setError("Impossible de charger la commande. Réessaie dans un instant.");
      }
      setLoading(false);
      return;
    }

    setOrder(orderRes.data as CustomerOrder);
    setLoading(false);
  }, [slug, orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!order || loading) return;
    const interval = setInterval(() => {
      supabase
        .rpc("get_order_for_customer", { p_shop_slug: slug, p_order_ref: orderId })
        .then(({ data, error: rpcError }) => {
          if (!rpcError && data) setOrder(data as CustomerOrder);
        });
    }, 30_000);
    return () => clearInterval(interval);
  }, [slug, orderId, order, loading]);

  useEffect(() => {
    if (!whatsappRedirect || !order || !shop || waAttempted.current) return;
    waAttempted.current = true;

    if (!shop.whatsapp) {
      setWaError(
        "Le vendeur n'a pas renseigné de WhatsApp. Contacte-le par un autre moyen ou attends sa réponse."
      );
      return;
    }

    const url = buildWhatsAppOrderUrl(shop.whatsapp, {
      orderId: order.order_id,
      items: order.items,
      total: order.total,
    });

    if (!url) {
      setWaError("Impossible de générer le lien WhatsApp. Utilise le bouton ci-dessous.");
      return;
    }

    setWaRedirecting(true);
    const t = setTimeout(() => {
      window.location.href = url;
    }, 800);
    return () => clearTimeout(t);
  }, [whatsappRedirect, order, shop]);

  if (loading) {
    return (
      <PageShell slug={slug}>
        <div className="flex flex-col items-center py-20 text-center">
          <Loader2 size={40} className="animate-spin text-violet-400" />
          <p className="mt-4 text-white/60">Chargement de ta commande…</p>
        </div>
      </PageShell>
    );
  }

  if (error || !order) {
    return (
      <PageShell slug={slug}>
        <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle size={40} className="mx-auto text-red-400" />
          <h1 className="mt-4 text-xl font-bold">Commande introuvable</h1>
          <p className="mt-2 text-sm text-white/60" role="alert">
            {error ?? "Cette commande n'existe pas ou le lien est incorrect."}
          </p>
          <Link
            href={`/${slug}`}
            className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold hover:bg-violet-500"
          >
            Retour à la boutique
          </Link>
        </div>
      </PageShell>
    );
  }

  const waUrl =
    shop?.whatsapp &&
    buildWhatsAppOrderUrl(shop.whatsapp, {
      orderId: order.order_id,
      items: order.items,
      total: order.total,
    });

  const trackingUrl =
    order.tracking_number &&
    buildTrackingUrl(order.tracking_carrier, order.tracking_number);

  return (
    <PageShell slug={slug}>
      {waRedirecting && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          Redirection vers WhatsApp pour finaliser le paiement…
        </div>
      )}
      {waError && (
        <div
          className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          role="alert"
        >
          {waError}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Package size={16} />
          Commande #{formatOrderNumber(order.order_id)}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Suivi de commande</h1>
        <p className="mt-1 text-sm text-white/50">
          {shop?.name} · {formatDate(order.created_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Statut actuel
            </p>
            <p className="mt-1 text-lg font-bold text-violet-300">
              {customerStatusLabel(order.status)}
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-4 font-bold">Progression</h2>
            <OrderTimeline status={order.status} />
          </section>

          {order.tracking_number && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck size={16} className="text-blue-400" />
                Suivi colis
              </div>
              <p className="mt-2 font-mono text-sm">{order.tracking_number}</p>
              {order.tracking_carrier && (
                <p className="mt-1 text-xs text-white/50">
                  Transporteur : {order.tracking_carrier}
                </p>
              )}
              {order.tracking_last_event && (
                <p className="mt-2 text-sm text-white/60">{order.tracking_last_event}</p>
              )}
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-violet-300 hover:text-violet-200"
                >
                  Suivre le colis →
                </a>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-4 font-bold">Produits commandés</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span className="text-white/80">
                    <span className="font-medium text-white">{item.quantity}×</span>{" "}
                    {item.product_name}
                    {item.variant_label ? (
                      <span className="text-white/40"> ({item.variant_label})</span>
                    ) : (
                      item.size && <span className="text-white/40"> ({item.size})</span>
                    )}
                  </span>
                  <span className="whitespace-nowrap font-medium">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-extrabold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Client</p>
            <p className="mt-1 font-semibold">{order.customer_name}</p>
            <p className="mt-3 text-xs text-white/40">
              Conserve cette page pour suivre ta commande à tout moment.
            </p>
          </div>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-500"
            >
              <MessageCircle size={18} />
              Contacter sur WhatsApp
            </a>
          )}

          <Link
            href={`/${slug}`}
            className="block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold hover:bg-white/10"
          >
            Retour à la boutique
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}

function PageShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <div className="py-5">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Retour à la boutique
        </Link>
      </div>
      {children}
    </div>
  );
}
