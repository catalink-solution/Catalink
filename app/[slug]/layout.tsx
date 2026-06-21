import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import type { ReactNode } from "react";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!shop) {
    notFound();
  }

  return (
    <StorefrontShell slug={shop.slug} shopId={shop.id} shopName={shop.name}>
      {children}
    </StorefrontShell>
  );
}
