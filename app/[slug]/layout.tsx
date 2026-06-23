import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ShopUnavailable } from "@/components/storefront/shop-unavailable";
import { fetchStorefrontShopBySlug } from "@/lib/storefront-shop";
import type { ReactNode } from "react";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: shop } = await fetchStorefrontShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  if (shop.is_suspended) {
    return <ShopUnavailable shopName={shop.name} />;
  }

  return (
    <StorefrontShell slug={shop.slug} shopId={shop.id} shopName={shop.name}>
      {children}
    </StorefrontShell>
  );
}
