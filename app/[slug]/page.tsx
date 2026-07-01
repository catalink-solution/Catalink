import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { fetchStorefrontShopBySlug } from "@/lib/storefront-shop";
import { logStorefrontProductDiagnostic } from "@/lib/storefront-products";
import { createAdminClient } from "@/lib/supabase-admin";
import { buildSocialLinks } from "@/lib/social";
import { SocialIcon } from "@/components/storefront/social-icon";
import { ProductCatalog } from "@/components/storefront/product-catalog";
import { ReviewsSection } from "@/components/storefront/reviews-section";
import type { Product, ProductCategory, Review, Shop } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: shop } = await supabase
    .from("shops_storefront")
    .select("name, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!shop) return { title: "Boutique introuvable — Catalink" };
  return {
    title: `${shop.name} — Catalink`,
    description: shop.description ?? `Découvre le catalogue de ${shop.name}.`,
  };
}

function SocialLinks({ shop }: { shop: Shop }) {
  const links = buildSocialLinks(shop);
  if (links.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-start gap-4 sm:gap-5">
      {links.map((l) => (
        <a
          key={l.platform}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          title={l.label}
          className="inline-flex shrink-0 transition-transform duration-300 ease-out hover:scale-105"
        >
          <SocialIcon platform={l.platform} />
        </a>
      ))}
    </div>
  );
}

export default async function PublicShopPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: shopData } = await fetchStorefrontShopBySlug(slug);

  const shop = shopData as Shop | null;
  if (!shop) notFound();

  const { data: productData } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const list = (productData ?? []) as Product[];

  const admin = createAdminClient();
  if (admin) {
    await logStorefrontProductDiagnostic(admin, shop.id, slug, list.length);
  }

  const { data: categoryData } = await supabase
    .from("product_categories")
    .select("*")
    .eq("shop_id", shop.id)
    .order("name", { ascending: true });

  const categories = (categoryData ?? []) as ProductCategory[];

  const { data: reviewData } = await supabase
    .from("reviews")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const reviews = (reviewData ?? []) as Review[];

  const { data: allRatings } = await supabase
    .from("reviews")
    .select("rating")
    .eq("shop_id", shop.id)
    .eq("is_published", true);

  const totalReviewCount = allRatings?.length ?? 0;
  const fullAvg =
    totalReviewCount > 0
      ? allRatings!.reduce((s, r) => s + (r.rating as number), 0) / totalReviewCount
      : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      {/* Shop header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10 mt-6">
        <div className="landing-glow pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-4 sm:gap-5">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-bold text-white/50 sm:h-20 sm:w-20">
                {(shop.name.trim().charAt(0) || "?").toUpperCase()}
              </div>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{shop.name}</h1>
          </div>
          {shop.description && (
            <p className="mt-3 max-w-2xl text-white/60">{shop.description}</p>
          )}
          <SocialLinks shop={shop} />
        </div>
      </section>

      <ProductCatalog slug={slug} shopId={shop.id} products={list} categories={categories} />

      <ReviewsSection
        slug={slug}
        reviews={reviews}
        avgRating={fullAvg}
        count={totalReviewCount}
      />
    </div>
  );
}
