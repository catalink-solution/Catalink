"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, lineId } from "@/components/storefront/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { items, totalPrice, updateQuantity, removeItem } = useCart();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <div className="py-5">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Continuer mes achats
        </Link>
      </div>

      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Mon panier</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-10 text-center">
          <p className="text-white/50">Ton panier est vide.</p>
          <Link
            href={`/${slug}`}
            className="btn-touch mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700"
          >
            Voir les produits
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={lineId(item)}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      {item.variantLabel ? (
                        <p className="text-xs text-white/40">{item.variantLabel}</p>
                      ) : (
                        item.size && (
                          <p className="text-xs text-white/40">Taille : {item.size}</p>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(lineId(item))}
                      className="btn-icon-touch text-white/40 hover:text-red-400"
                      aria-label="Retirer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(lineId(item), item.quantity - 1)}
                        className="btn-icon-touch px-2.5 py-1.5 text-white/70 hover:text-white"
                        aria-label="Diminuer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(lineId(item), item.quantity + 1)}
                        className="btn-icon-touch px-2.5 py-1.5 text-white/70 hover:text-white"
                        aria-label="Augmenter"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-bold text-violet-300">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between text-lg">
              <span className="text-white/70">Total</span>
              <span className="font-extrabold">{formatPrice(totalPrice)}</span>
            </div>
            <Link
              href={`/${slug}/checkout`}
              className="btn-touch mt-5 block w-full rounded-xl px-6 py-3.5 text-center font-bold text-white transition-all"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
            >
              Passer la commande
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
