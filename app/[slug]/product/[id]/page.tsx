import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { fetchStorefrontShopBySlug } from "@/lib/storefront-shop";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { VariantProduct } from "@/components/storefront/variant-product";
import { AvailabilityBadge, storefrontAvailabilityStatus } from "@/components/storefront/availability-badge";
import { SINGLE_SIZE } from "@/lib/stock";
import type {
  Product,
  ProductImage,
  ProductVariant,
  ProductAttribute,
  ProductAttributeValue,
  ProductSku,
  ProductSkuValue,
  ProductSkuImage,
  Shop,
} from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

const EMPTY_VARIANTS = {
  attributes: [] as ProductAttribute[],
  values: [] as ProductAttributeValue[],
  skus: [] as ProductSku[],
  skuValues: [] as ProductSkuValue[],
  skuImages: [] as ProductSkuImage[],
};

async function getData(slug: string, id: string) {
  const { data: shopData } = await fetchStorefrontShopBySlug(slug);
  const shop = shopData as Shop | null;
  if (!shop) return { shop: null, product: null, images: [], variants: [], variantData: EMPTY_VARIANTS };

  const { data: productData } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .maybeSingle();

  const product = productData as Product | null;
  if (!product) return { shop, product: null, images: [], variants: [], variantData: EMPTY_VARIANTS };

  const [{ data: imgs }, { data: vars }] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", id).order("position", { ascending: true }),
    supabase.from("product_variants").select("*").eq("product_id", id),
  ]);

  let variantData = EMPTY_VARIANTS;
  if (product.has_variants) {
    const [{ data: attrs }, { data: attrValues }, { data: skus }, { data: skuValues }, { data: skuImages }] =
      await Promise.all([
        supabase.from("product_attributes").select("*").eq("product_id", id).order("position", { ascending: true }),
        supabase.from("product_attribute_values").select("*"),
        supabase.from("product_skus").select("*").eq("product_id", id),
        supabase.from("product_sku_values").select("*"),
        supabase.from("product_sku_images").select("*"),
      ]);
    const attributes = (attrs ?? []) as ProductAttribute[];
    const attrIds = new Set(attributes.map((a) => a.id));
    const values = ((attrValues ?? []) as ProductAttributeValue[]).filter((v) => attrIds.has(v.attribute_id));
    const skuList = (skus ?? []) as ProductSku[];
    const skuIds = new Set(skuList.map((s) => s.id));
    variantData = {
      attributes,
      values,
      skus: skuList,
      skuValues: ((skuValues ?? []) as ProductSkuValue[]).filter((l) => skuIds.has(l.sku_id)),
      skuImages: ((skuImages ?? []) as ProductSkuImage[]).filter((i) => skuIds.has(i.sku_id)),
    };
  }

  return {
    shop,
    product,
    images: (imgs ?? []) as ProductImage[],
    variants: (vars ?? []) as ProductVariant[],
    variantData,
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
  const { shop, product, images, variants, variantData } = await getData(slug, id);

  if (!shop || !product) notFound();

  const galleryImages =
    images.length > 0
      ? images.map((i) => i.image_url)
      : product.image_url
        ? [product.image_url]
        : [];

  const hasV3 = product.has_variants && variantData.skus.length > 0;

  if (hasV3) {
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
        <VariantProduct
          slug={slug}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            category: product.category,
            image_url: product.image_url,
          }}
          baseImages={galleryImages}
          attributes={variantData.attributes}
          values={variantData.values}
          skus={variantData.skus}
          skuValues={variantData.skuValues}
          skuImages={variantData.skuImages}
        />
      </div>
    );
  }

  const stockMap: Record<string, number> = {};
  for (const v of variants) stockMap[v.size] = v.stock;
  const totalStockQty = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  const outOfStock = product.track_stock && totalStockQty <= 0;
  const availabilityStatus = storefrontAvailabilityStatus(
    product.track_stock,
    totalStockQty
  );
  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const showPriceBadge = !hasSizes || outOfStock;

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

      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <ProductGallery images={galleryImages} alt={product.name} />

        <div className="relative z-10 flex min-w-0 flex-col">
          {product.category && (
            <span className="mb-2 text-xs uppercase tracking-widest text-white/40">
              {product.category}
            </span>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-bold text-violet-300">{formatPrice(product.price)}</p>
            {showPriceBadge && <AvailabilityBadge status={availabilityStatus} />}
          </div>

          {product.description && (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-white/70">
              {product.description}
            </p>
          )}

          {!outOfStock ? (
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
          ) : (
            <p className="mt-8 text-sm text-white/50">
              Ce produit n&apos;est pas disponible à la commande pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
