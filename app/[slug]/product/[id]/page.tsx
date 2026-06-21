import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { SINGLE_SIZE } from "@/lib/stock";
import type { Product, ProductImage, ProductVariant, Shop } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

async function getData(slug: string, id: string) {
  const { data: shopData } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const shop = shopData as Shop | null;
  if (!shop) return { shop: null, product: null, images: [], variants: [] };

  const { data: productData } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .maybeSingle();

  const product = productData as Product | null;
  if (!product) return { shop, product: null, images: [], variants: [] };

  const [{ data: imgs }, { data: vars }] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", id).order("position", { ascending: true }),
    supabase.from("product_variants").select("*").eq("product_id", id),
  ]);

  return {
    shop,
    product,
    images: (imgs ?? []) as ProductImage[],
    variants: (vars ?? []) as ProductVariant[],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const { product } = await getData(slug, id);
  if (!product) return { title: "Produit introuvable — Catalink" };
  return {
    title: `${product.name} — Catalink`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, id } = await params;
  const { shop, product, images, variants } = await getData(slug, id);

  if (!shop || !product) notFound();

  const galleryImages =
    images.length > 0
      ? images.map((i) => i.image_url)
      : product.image_url
        ? [product.image_url]
        : [];

  const stockMap: Record<string, number> = {};
  for (const v of variants) stockMap[v.size] = v.stock;
  const totalStockQty = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  const outOfStock = product.track_stock && totalStockQty <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <div className="py-5">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Retour à la boutique
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={galleryImages} alt={product.name} />

        <div className="relative z-10 flex flex-col">
          {product.category && (
            <span className="mb-2 text-xs uppercase tracking-widest text-white/40">
              {product.category}
            </span>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-2xl font-bold text-violet-300">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-white/70">
              {product.description}
            </p>
          )}

          {outOfStock ? (
            <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              Produit indisponible — rupture de stock.
            </div>
          ) : (
            <div className="mt-8 relative z-10">
              <AddToCart
                slug={slug}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  sizes: product.sizes,
                }}
                trackStock={product.track_stock}
                stock={stockMap}
                singleSizeKey={SINGLE_SIZE}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
