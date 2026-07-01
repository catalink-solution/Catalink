"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import {
  AvailabilityBadge,
  storefrontAvailabilityStatus,
} from "./availability-badge";

export function AddToCart({
  slug,
  product,
  trackStock = false,
  stock = {},
  singleSizeKey = "Taille unique",
}: {
  slug: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    sizes: string[] | null;
  };
  trackStock?: boolean;
  stock?: Record<string, number>;
  singleSizeKey?: string;
}) {
  const { addItem } = useCart();
  const sizes = product.sizes ?? [];
  const actionsRef = useRef<HTMLDivElement>(null);

  function availableFor(s: string | null): number {
    if (!trackStock) return Infinity;
    const key = s ?? singleSizeKey;
    return stock[key] ?? 0;
  }

  function sizeDisabled(s: string): boolean {
    return trackStock && availableFor(s) <= 0;
  }

  const initialSize = sizes.length === 1 && !sizeDisabled(sizes[0]) ? sizes[0] : null;
  const [size, setSize] = useState<string | null>(initialSize);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeRequired, setSizeRequired] = useState(false);

  const available = availableFor(size);
  const maxQty = available === Infinity ? Infinity : available;
  const needsSize = sizes.length > 0 && !size;
  const allSizesDisabled = sizes.length > 0 && sizes.every(sizeDisabled);

  function showError(msg: string) {
    setError(msg);
    setSizeRequired(msg.includes("taille"));
    requestAnimationFrame(() => {
      actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function handleAdd(e?: FormEvent) {
    e?.preventDefault();
    if (sizes.length > 0 && !size) {
      showError("Choisis une taille avant d'ajouter au panier.");
      return;
    }
    const avail = availableFor(size);
    if (trackStock && avail <= 0) {
      showError("Cette sélection est en rupture de stock.");
      return;
    }
    if (trackStock && quantity > avail) {
      showError("Stock insuffisant pour cette quantité.");
      return;
    }
    setError(null);
    setSizeRequired(false);
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
        size,
        skuId: null,
        variantLabel: null,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const showAvailability = sizes.length > 0 && size != null;

  return (
    <div ref={actionsRef} className="relative z-10 space-y-6">
      {showAvailability && (
        <AvailabilityBadge
          status={storefrontAvailabilityStatus(trackStock, available === Infinity ? 1 : available)}
        />
      )}

      {sizes.length > 0 && (
        <div className={sizeRequired ? "rounded-xl ring-2 ring-red-400/60 ring-offset-2 ring-offset-[#030712]" : ""}>
          <p className="mb-2 text-sm font-medium text-white/70">Taille</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const disabled = sizeDisabled(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSize(s);
                    setQuantity(1);
                    setError(null);
                    setSizeRequired(false);
                  }}
                  className={`btn-touch min-h-[44px] min-w-12 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                    disabled
                      ? "cursor-not-allowed border-white/10 bg-white/5 text-white/25 line-through"
                      : size === s
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-white/15 bg-white/5 text-white/80 hover:border-white/30"
                  }`}
                  title={disabled ? "Épuisé" : undefined}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-white/70">Quantité</p>
        <div className="inline-flex items-center rounded-xl border border-white/15 bg-white/5">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="btn-icon-touch rounded-l-xl px-3 py-2 text-white/70 hover:text-white"
            aria-label="Diminuer"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => (maxQty === Infinity ? q + 1 : Math.min(maxQty, q + 1)))}
            disabled={maxQty !== Infinity && quantity >= maxQty}
            className="btn-icon-touch rounded-r-xl px-3 py-2 text-white/70 hover:text-white disabled:opacity-40"
            aria-label="Augmenter"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={allSizesDisabled || (trackStock && size != null && available <= 0)}
          className="btn-touch inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
        >
          {added ? (
            <>
              <Check size={18} /> Ajouté au panier
            </>
          ) : needsSize ? (
            <>
              <ShoppingBag size={18} /> Choisir une taille
            </>
          ) : (
            <>
              <ShoppingBag size={18} /> Ajouter au panier
            </>
          )}
        </button>
        <Link
          href={`/${slug}/cart`}
          className="btn-touch inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
        >
          Voir le panier
        </Link>
      </form>
    </div>
  );
}
