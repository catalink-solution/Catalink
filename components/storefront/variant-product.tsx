"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import { ProductGallery } from "./product-gallery";
import { AvailabilityBadge, storefrontAvailabilityStatus } from "./availability-badge";
import { formatPrice } from "@/lib/format";
import {
  isColorAttribute,
  isLightColor,
  resolveSkus,
  findSku,
  availableValueIds,
} from "@/lib/variants";
import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductSku,
  ProductSkuValue,
  ProductSkuImage,
} from "@/lib/types";

type Props = {
  slug: string;
  product: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    category: string | null;
    image_url: string | null;
  };
  baseImages: string[];
  attributes: ProductAttribute[];
  values: ProductAttributeValue[];
  skus: ProductSku[];
  skuValues: ProductSkuValue[];
  skuImages: ProductSkuImage[];
};

export function VariantProduct({
  slug,
  product,
  baseImages,
  attributes,
  values,
  skus,
  skuValues,
  skuImages,
}: Props) {
  const { addItem } = useCart();

  const resolved = useMemo(
    () => resolveSkus({ attributes, values, skus, skuValues }),
    [attributes, values, skus, skuValues]
  );

  const valuesByAttribute = useMemo(() => {
    const map = new Map<string, ProductAttributeValue[]>();
    for (const a of attributes) {
      map.set(
        a.id,
        values
          .filter((v) => v.attribute_id === a.id)
          .sort((x, y) => x.position - y.position)
      );
    }
    return map;
  }, [attributes, values]);

  const imagesBySku = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const im of [...skuImages].sort((a, b) => a.sort_order - b.sort_order)) {
      const arr = map.get(im.sku_id) ?? [];
      arr.push(im.image_url);
      map.set(im.sku_id, arr);
    }
    return map;
  }, [skuImages]);

  const [selected, setSelected] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    for (const a of attributes) init[a.id] = null;
    return init;
  });
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedValueIds = useMemo(
    () => Object.values(selected).filter((v): v is string => Boolean(v)),
    [selected]
  );

  const allSelected = attributes.every((a) => selected[a.id]);
  const currentSku = useMemo(
    () => (allSelected ? findSku(resolved, selectedValueIds) : null),
    [allSelected, resolved, selectedValueIds]
  );

  // Images : combinaison choisie → ses photos ; sinon photos des skus
  // correspondant à la sélection partielle (ex : couleur) ; sinon photos produit.
  const images = useMemo(() => {
    if (selectedValueIds.length === 0) return baseImages;
    const candidates = resolved.filter((s) =>
      selectedValueIds.every((id) => s.valueIds.includes(id))
    );
    for (const s of candidates) {
      const imgs = imagesBySku.get(s.id);
      if (imgs && imgs.length > 0) return imgs;
    }
    return baseImages;
  }, [selectedValueIds, resolved, imagesBySku, baseImages]);

  const displayPrice = currentSku?.price ?? product.price;
  const stock = currentSku?.stock_quantity ?? null;
  const soldOut = currentSku != null && (!currentSku.active || currentSku.stock_quantity <= 0);
  const maxQty = stock != null && stock > 0 ? stock : Infinity;

  function selectValue(attributeId: string, valueId: string) {
    setSelected((prev) => ({
      ...prev,
      [attributeId]: prev[attributeId] === valueId ? null : valueId,
    }));
    setQuantity(1);
    setError(null);
    setAdded(false);
  }

  function handleAdd(e?: FormEvent) {
    e?.preventDefault();
    if (!allSelected) {
      setError("Choisis toutes les options avant d'ajouter au panier.");
      return;
    }
    if (!currentSku) {
      setError("Cette combinaison n'est pas disponible.");
      return;
    }
    if (!currentSku.active || currentSku.stock_quantity <= 0) {
      setError("Cette variante est en rupture de stock.");
      return;
    }
    if (quantity > currentSku.stock_quantity) {
      setError("Stock insuffisant pour cette quantité.");
      return;
    }
    setError(null);
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: displayPrice,
        imageUrl: images[0] ?? product.image_url,
        size: null,
        skuId: currentSku.id,
        variantLabel: currentSku.label,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <ProductGallery key={images[0] ?? "none"} images={images} alt={product.name} />

        <div className="relative z-10 flex min-w-0 flex-col">
          {product.category && (
            <span className="mb-2 text-xs uppercase tracking-widest text-white/40">
              {product.category}
            </span>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-bold text-violet-300">{formatPrice(displayPrice)}</p>
            {allSelected && currentSku && (
              <AvailabilityBadge
                status={storefrontAvailabilityStatus(
                  true,
                  currentSku.active && currentSku.stock_quantity > 0 ? currentSku.stock_quantity : 0
                )}
              />
            )}
          </div>

        {product.description && (
          <p className="mt-5 whitespace-pre-line leading-relaxed text-white/70">
            {product.description}
          </p>
        )}

        <form onSubmit={handleAdd} className="mt-8 space-y-6">
          {attributes.map((attr) => {
            const attrValues = valuesByAttribute.get(attr.id) ?? [];
            const others = Object.entries(selected)
              .filter(([aid]) => aid !== attr.id)
              .map(([, vid]) => vid)
              .filter((v): v is string => Boolean(v));
            const available = availableValueIds(
              resolved,
              attrValues.map((v) => v.id),
              others
            );
            const color = isColorAttribute(attr.name);

            return (
              <div key={attr.id}>
                <p className="mb-2 text-sm font-medium text-white/70">{attr.name}</p>
                <div className="flex flex-wrap gap-2">
                  {attrValues.map((v) => {
                    const isSelected = selected[attr.id] === v.id;
                    const disabled = !available.has(v.id);
                    if (color && v.hex) {
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => selectValue(attr.id, v.id)}
                          title={v.value}
                          aria-label={v.value}
                          className={`btn-icon-touch relative h-10 w-10 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-violet-400 ring-2 ring-violet-400/40"
                              : isLightColor(v.hex)
                                ? "border-white/40"
                                : "border-white/15"
                          } ${disabled ? "cursor-not-allowed opacity-30" : "hover:scale-105"}`}
                          style={{ background: v.hex }}
                        >
                          {isSelected && (
                            <Check
                              size={16}
                              className={isLightColor(v.hex) ? "text-black" : "text-white"}
                              style={{ margin: "auto" }}
                            />
                          )}
                          {disabled && (
                            <span className="absolute inset-0 m-auto h-[2px] w-8 rotate-45 bg-red-400/70" />
                          )}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectValue(attr.id, v.id)}
                        className={`btn-touch min-h-[44px] min-w-12 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                          disabled
                            ? "cursor-not-allowed border-white/10 bg-white/5 text-white/25 line-through"
                            : isSelected
                              ? "border-violet-500 bg-violet-600 text-white"
                              : "border-white/15 bg-white/5 text-white/80 hover:border-white/30"
                        }`}
                      >
                        {v.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantité */}
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
                onClick={() =>
                  setQuantity((q) => (maxQty === Infinity ? q + 1 : Math.min(maxQty, q + 1)))
                }
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={soldOut}
              className="btn-touch inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
            >
              {added ? (
                <>
                  <Check size={18} /> Ajouté au panier
                </>
              ) : !allSelected ? (
                <>
                  <ShoppingBag size={18} /> Choisir les options
                </>
              ) : soldOut ? (
                "Rupture de stock"
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
          </div>
        </form>
      </div>
    </div>
  );
}
