"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";

export function StorefrontHeader({
  slug,
  shopName,
}: {
  slug: string;
  shopName: string;
}) {
  const { totalQuantity } = useCart();

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/[0.08]"
      style={{ background: "rgba(3,7,18,0.85)", backdropFilter: "blur(16px)" }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href={`/${slug}`} className="min-w-0">
          <span className="block truncate text-lg font-extrabold tracking-tight text-white">
            {shopName}
          </span>
        </Link>

        <Link
          href={`/${slug}/cart`}
          className="btn-touch relative inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <ShoppingBag size={18} />
          <span className="hidden sm:inline">Panier</span>
          {totalQuantity > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
            >
              {totalQuantity}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
