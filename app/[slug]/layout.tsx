import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ShopUnavailable } from "@/components/storefront/shop-unavailable";
import { fetchStorefrontShopBySlug } from "@/lib/storefront-shop";
import { isOrderTrackingPath } from "@/lib/storefront-routes";
import type { ReactNode } from "react";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pathname = (await headers()).get("x-pathname") ?? "";
  const orderPage = isOrderTrackingPath(pathname, slug);

  const { data: shop } = await fetchStorefrontShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  if (shop.is_suspended && !orderPage) {
    return <ShopUnavailable shopName={shop.name} />;
  }

  if (orderPage && shop.is_suspended) {
    return (
      <div className="flex min-h-screen flex-col bg-[#030712] text-white">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <StorefrontShell slug={shop.slug} shopId={shop.id} shopName={shop.name}>
      {children}
    </StorefrontShell>
  );
}
