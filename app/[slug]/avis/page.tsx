"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Star, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ReviewItem = {
  product_id: string;
  product_name: string;
  already_reviewed: boolean;
};

export default function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [shopId, setShopId] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [activeProduct, setActiveProduct] = useState<ReviewItem | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("shops")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setShopId(data?.id ?? null));
  }, [slug]);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    if (!shopId || !orderRef.trim()) return;
    setLoading(true);
    setError(null);
    setOrderId(null);
    setItems([]);

    const { data, error: rpcError } = await supabase.rpc("get_order_for_review", {
      p_shop_id: shopId,
      p_order_ref: orderRef.trim(),
    });

    setLoading(false);
    if (rpcError) {
      const msg = rpcError.message;
      if (msg.includes("order_not_delivered"))
        setError("Cette commande n'est pas encore livrée.");
      else if (msg.includes("order_not_found"))
        setError("Commande introuvable. Vérifie le numéro.");
      else setError(msg);
      return;
    }

    const result = data as { order_id: string; items: ReviewItem[] };
    setOrderId(result.order_id);
    setItems(result.items);
    const pending = result.items.find((i) => !i.already_reviewed);
    setActiveProduct(pending ?? null);
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `reviews/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    setUploading(false);
    if (error) {
      setError("Erreur upload : " + error.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!orderId || !activeProduct) return;
    if (!name.trim()) return setError("Indique ton prénom.");
    setSubmitting(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("submit_review", {
      p_order_id: orderId,
      p_product_id: activeProduct.product_id,
      p_name: name.trim(),
      p_rating: rating,
      p_comment: comment.trim() || null,
      p_photo_url: photoUrl,
    });

    setSubmitting(false);
    if (rpcError) {
      if (rpcError.message.includes("already_reviewed"))
        setError("Tu as déjà laissé un avis pour ce produit.");
      else setError(rpcError.message);
      return;
    }

    const remaining = items.map((i) =>
      i.product_id === activeProduct.product_id ? { ...i, already_reviewed: true } : i
    );
    setItems(remaining);
    setComment("");
    setPhotoUrl(null);
    setRating(5);
    const next = remaining.find((i) => !i.already_reviewed);
    if (next) {
      setActiveProduct(next);
    } else {
      setDone(true);
      setActiveProduct(null);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <CheckCircle2 size={56} className="mx-auto text-green-400" />
        <h1 className="mt-5 text-2xl font-extrabold">Merci pour ton avis !</h1>
        <p className="mt-3 text-white/60">Tes retours aident la boutique à s'améliorer.</p>
        <Link
          href={`/${slug}`}
          className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-500"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 sm:px-6">
      <div className="py-5">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft size={16} /> Retour à la boutique
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Laisser un avis</h1>
      <p className="mb-6 text-sm text-white/50">
        Disponible uniquement pour les commandes livrées. Utilise le numéro reçu lors de ta commande.
      </p>

      {!orderId ? (
        <form onSubmit={lookup} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/70">
              N° de commande
            </span>
            <input
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              placeholder="Ex : a1b2c3d4"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
            />
          </label>
          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !orderRef.trim()}
            className="btn-touch w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Recherche…" : "Vérifier ma commande"}
          </button>
        </form>
      ) : activeProduct ? (
        <form onSubmit={submit} className="relative z-10 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm text-white/50">
            Avis pour : <span className="font-medium text-white">{activeProduct.product_name}</span>
          </p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/70">Ton prénom *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
            />
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-white/70">Note *</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="btn-icon-touch rounded-lg"
                  aria-label={`${i + 1} étoiles`}
                >
                  <Star
                    size={28}
                    className={
                      i < rating ? "fill-amber-400 text-amber-400" : "text-white/20"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/70">Commentaire</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-violet-500"
              placeholder="Partage ton expérience…"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/70">
              Photo (optionnel)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadPhoto(f);
              }}
              className="text-sm text-white/50"
            />
            {uploading && <p className="mt-1 text-xs text-white/40">Upload…</p>}
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Aperçu" className="mt-2 h-20 w-20 rounded-lg object-cover" />
            )}
          </label>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-touch w-full rounded-xl py-3 font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            {submitting ? "Envoi…" : "Publier mon avis"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-white/50">Tous les produits de cette commande ont déjà été notés.</p>
          <Link href={`/${slug}`} className="mt-4 inline-block text-violet-300 hover:text-violet-200">
            Retour à la boutique
          </Link>
        </div>
      )}
    </div>
  );
}
