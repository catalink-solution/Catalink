"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { MAIN_CATEGORIES } from "@/lib/categories";
import type { Product, ProductCategory } from "@/lib/types";

const MAIN_FILTERS = ["Tous", ...MAIN_CATEGORIES] as const;

export function ProductCatalog({
  slug,
  products,
  categories,
}: {
  slug: string;
  products: Product[];
  categories: ProductCategory[];
}) {
  const [selectedMain, setSelectedMain] = useState<string>("Tous");
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);

  const customById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  // Custom sub-categories that actually exist within the selected main category.
  const subCategories = useMemo(() => {
    if (selectedMain === "Tous") return [] as { id: string; name: string }[];
    const ids = new Set<string>();
    for (const p of products) {
      if (p.product_main_category === selectedMain && p.product_custom_category_id) {
        ids.add(p.product_custom_category_id);
      }
    }
    return [...ids]
      .map((id) => ({ id, name: customById[id] }))
      .filter((x) => x.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedMain, customById]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const mainOk = selectedMain === "Tous" || p.product_main_category === selectedMain;
      const customOk =
        selectedCustomId === null || p.product_custom_category_id === selectedCustomId;
      return mainOk && customOk;
    });
  }, [products, selectedMain, selectedCustomId]);

  function selectMain(main: string) {
    setSelectedMain(main);
    setSelectedCustomId(null);
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Produits</h2>
        <span className="text-sm text-white/40">{filtered.length} article(s)</span>
      </div>

      {/* Main category filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        {MAIN_FILTERS.map((main) => (
          <button
            key={main}
            type="button"
            onClick={() => selectMain(main)}
            className={`btn-touch min-h-[44px] rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              selectedMain === main
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {main}
          </button>
        ))}
      </div>

      {/* Custom sub-category filters (within selected main) */}
      {subCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCustomId(null)}
            className={`btn-touch min-h-[44px] rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCustomId === null
                ? "bg-violet-600 text-white"
                : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            Tous
          </button>
          {subCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCustomId(c.id)}
              className={`btn-touch min-h-[44px] rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCustomId === c.id
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-10 text-center text-white/50">
          Aucun produit dans cette catégorie pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/${slug}/product/${product.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-white/25"
            >
              <div className="aspect-square w-full overflow-hidden bg-white/5">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    Pas d&apos;image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                {(product.product_main_category || product.category) && (
                  <span className="mb-1 text-[11px] uppercase tracking-wide text-white/40">
                    {product.product_main_category || product.category}
                  </span>
                )}
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                  {product.name}
                </h3>
                <p className="mt-auto pt-2 font-bold text-violet-300">
                  {formatPrice(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
