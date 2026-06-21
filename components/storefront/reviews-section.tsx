import Link from "next/link";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

export function ReviewsSection({
  slug,
  reviews,
  avgRating,
  count,
}: {
  slug: string;
  reviews: Review[];
  avgRating: number;
  count: number;
}) {
  if (count === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Avis clients</h2>
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={Math.round(avgRating)} />
            <span className="text-sm text-white/60">
              {avgRating.toFixed(1)} · {count} avis
            </span>
          </div>
        </div>
        <Link
          href={`/${slug}/avis`}
          className="text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          Laisser un avis →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-2">
              <Stars rating={r.rating} />
              <span className="text-sm font-medium">{r.customer_name || "Client"}</span>
            </div>
            {r.comment && (
              <p className="mt-2 text-sm text-white/70 line-clamp-3">{r.comment}</p>
            )}
            {r.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.photo_url}
                alt="Photo avis"
                className="mt-2 h-20 w-20 rounded-lg object-cover"
              />
            )}
            <p className="mt-2 text-xs text-white/30">{formatDate(r.created_at)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? "fill-amber-400 text-amber-400" : "text-white/15"}
        />
      ))}
    </span>
  );
}
