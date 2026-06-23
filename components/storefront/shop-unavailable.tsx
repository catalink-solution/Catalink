import { ShieldOff } from "lucide-react";
import Link from "next/link";

export function ShopUnavailable({ shopName }: { shopName?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#030712] p-6 text-center text-white">
      <ShieldOff className="mb-4 text-amber-400" size={48} />
      <h1 className="text-2xl font-bold">Boutique indisponible</h1>
      <p className="mt-3 max-w-md text-white/60">
        {shopName ? (
          <>
            La boutique <span className="font-semibold text-white/80">{shopName}</span> est
            temporairement indisponible.
          </>
        ) : (
          <>Cette boutique est temporairement indisponible.</>
        )}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/5"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
