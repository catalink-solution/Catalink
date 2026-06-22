"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

/** Page AI Import — désactivée pour V1, code conservé en arrière-plan. */
export default function AiImportDisabledPage() {
  return (
    <main className="p-4 sm:p-6 md:p-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-violet-500/30 bg-violet-500/5 p-8 text-center">
        <Sparkles className="mx-auto mb-4 text-violet-400" size={40} />
        <span className="mb-3 inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
          Beta — bientôt disponible
        </span>
        <h1 className="text-2xl font-extrabold">Import IA</h1>
        <p className="mt-3 text-sm text-white/60">
          Le regroupement automatique par intelligence artificielle arrive prochainement.
          En attendant, utilise <strong className="text-white">Import Rapide</strong> pour créer
          tes produits manuellement en quelques clics — sans coût IA.
        </p>
        <Link
          href="/dashboard/products/quick-import"
          className="btn-touch mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white hover:bg-violet-500"
        >
          <Zap size={18} /> Import Rapide <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
