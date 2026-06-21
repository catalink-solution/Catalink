"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

export default function ReviewsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);

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
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) {
      setMessage("Crée d'abord ta boutique.");
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as Review[]);
    setLoading(false);
  }

  async function togglePublish(r: Review) {
    await supabase
      .from("reviews")
      .update({ is_published: !r.is_published })
      .eq("id", r.id);
    setReviews((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, is_published: !x.is_published } : x))
    );
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Avis clients</h1>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 py-16 text-center">
          <Star size={40} className="text-white/20" />
          <p className="mt-4 text-white/50">
            Aucun avis pour le moment. Tes clients pourront en laisser une fois leur commande livrée.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border p-4 ${
                r.is_published
                  ? "border-white/10 bg-white/[0.02]"
                  : "border-white/5 bg-white/[0.01] opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    <span className="font-medium">{r.customer_name || "Client"}</span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-white/70">{r.comment}</p>
                  )}
                  <p className="mt-1 text-xs text-white/30">{formatDate(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photo_url}
                      alt="Photo avis"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  )}
                  <button
                    onClick={() => togglePublish(r)}
                    className="rounded-lg border border-white/10 p-2 text-white/50 hover:bg-white/5 hover:text-white"
                    title={r.is_published ? "Masquer" : "Publier"}
                  >
                    {r.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "text-amber-400" : "text-white/15"}>
          ★
        </span>
      ))}
    </span>
  );
}
