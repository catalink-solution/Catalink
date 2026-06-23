"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCart, lineId } from "@/components/storefront/cart-context";
import {
  getCheckoutAttribution,
  syncAbandonedCartContact,
} from "@/components/storefront/storefront-tracker";
import { formatPrice } from "@/lib/format";

type ShopInfo = { id: string; name: string; whatsapp: string | null };

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { items, totalPrice, clear } = useCart();

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null);

  useEffect(() => {
    supabase
      .from("shops_storefront")
      .select("id, name, whatsapp, is_suspended")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.is_suspended) {
          setError("Cette boutique est indisponible.");
          return;
        }
        setShop(data as ShopInfo | null);
      });
  }, [slug]);

  // Sync contact info into abandoned cart as user fills the form
  useEffect(() => {
    if (!shop || items.length === 0) return;
    if (!name.trim() && !phone.trim() && !email.trim()) return;
    const t = setTimeout(() => {
      syncAbandonedCartContact(shop.id, slug, items, totalPrice, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
    }, 800);
    return () => clearTimeout(t);
  }, [shop, slug, items, totalPrice, name, phone, email]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Indique ton nom.");
    if (!phone.trim() && !email.trim())
      return setError("Indique un téléphone ou un email.");
    if (!address.trim()) return setError("L'adresse de livraison est obligatoire.");
    if (!shop) return setError("Boutique introuvable.");
    if (items.length === 0) return setError("Ton panier est vide.");

    setSubmitting(true);

    const payloadItems = items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      size: i.size ?? "",
      sku_id: i.skuId ?? "",
      variant_label: i.variantLabel ?? "",
    }));

    const contact = phone.trim() || email.trim();
    const { sessionId, refCode, promoCode } = getCheckoutAttribution(slug);
    const { data, error: rpcError } = await supabase.rpc("create_order", {
      p_shop_id: shop.id,
      p_customer_name: name.trim(),
      p_customer_contact: contact,
      p_customer_address: address.trim() || null,
      p_message: message.trim() || null,
      p_items: payloadItems,
      p_customer_email: email.trim() || null,
      p_customer_phone: phone.trim() || null,
      p_session_id: sessionId || null,
      p_ref_code: refCode || null,
      p_promo_code: promoCode || null,
    });

    setSubmitting(false);

    if (rpcError) {
      const msg =
        rpcError.message.includes("shop_suspended")
          ? "Cette boutique est indisponible."
          : "Une erreur est survenue : " + rpcError.message;
      setError(msg);
      return;
    }

    const orderId = data as string;
    setSuccess({ orderId, total: totalPrice });
    clear();

    // Email notification to shop owner (non-blocking)
    fetch("/api/email/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});
  }

  if (success) {
    const waText = encodeURIComponent(
      `Bonjour ${shop?.name ?? ""}, je viens de passer la commande n°${success.orderId.slice(
        0,
        8
      )} pour un total de ${formatPrice(success.total)}.`
    );
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <CheckCircle2 size={56} className="mx-auto text-green-400" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Commande envoyée !</h1>
        <p className="mt-3 text-white/60">
          Ta commande a bien été enregistrée. Le vendeur va te recontacter rapidement.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">N° de commande</span>
            <span className="font-mono">{success.orderId.slice(0, 8)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-white/50">Total</span>
            <span className="font-bold">{formatPrice(success.total)}</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-white/40">
          Conserve ton n° de commande — tu pourras laisser un avis une fois livré sur{" "}
          <Link href={`/${slug}/avis`} className="text-violet-300 hover:text-violet-200">
            la page avis
          </Link>
          .
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {shop?.whatsapp && (
            <a
              href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500"
            >
              Confirmer sur WhatsApp
            </a>
          )}
          <Link
            href={`/${slug}`}
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <div className="py-5">
        <Link
          href={`/${slug}/cart`}
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Retour au panier
        </Link>
      </div>

      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Finaliser la commande</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-10 text-center">
          <p className="text-white/50">Ton panier est vide.</p>
          <Link
            href={`/${slug}`}
            className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700"
          >
            Voir les produits
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Form */}
          <form
            onSubmit={submit}
            className="relative z-10 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          >
            <Field label="Nom complet *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                name="name"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
              />
            </Field>
            <Field label="Téléphone *">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
              />
            </Field>
            <Field label="Email (optionnel)">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@email.com"
                name="email"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
              />
            </Field>
            <Field label="Adresse de livraison *">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="12 rue de la Paix, 75002 Paris"
                name="address"
                autoComplete="street-address"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
              />
            </Field>
            <Field label="Message (optionnel)">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Une précision sur ta commande ?"
                name="message"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
              />
            </Field>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-touch w-full rounded-xl px-6 py-3.5 font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
            >
              {submitting ? "Envoi en cours…" : "Envoyer ma commande"}
            </button>
          </form>

          {/* Summary */}
          <div className="h-fit rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-4 font-bold">Récapitulatif</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={lineId(item)}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 text-white/70">
                    <span className="font-medium text-white">{item.quantity}×</span>{" "}
                    {item.name}
                    {item.variantLabel ? (
                      <span className="text-white/40"> ({item.variantLabel})</span>
                    ) : (
                      item.size && <span className="text-white/40"> ({item.size})</span>
                    )}
                  </span>
                  <span className="whitespace-nowrap font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg font-extrabold">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
