"use client";

import type { ReactNode } from "react";
import { CartProvider } from "./cart-context";
import { StorefrontHeader } from "./storefront-header";
import { StorefrontTracker } from "./storefront-tracker";

export function StorefrontShell({
  slug,
  shopId,
  shopName,
  children,
}: {
  slug: string;
  shopId: string;
  shopName: string;
  children: ReactNode;
}) {
  return (
    <CartProvider slug={slug}>
      <StorefrontTracker shopId={shopId} slug={slug} />
      <div className="flex min-h-screen flex-col bg-[#030712] text-white">
        <StorefrontHeader slug={slug} shopName={shopName} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-white/40">
          Propulsé par{" "}
          <a href="/" className="font-semibold text-white/60 hover:text-white">
            Catalink
          </a>
        </footer>
      </div>
    </CartProvider>
  );
}
