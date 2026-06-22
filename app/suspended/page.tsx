"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SuspendedPage() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#030712] p-6 text-center text-white">
      <ShieldOff className="mb-4 text-red-400" size={48} />
      <h1 className="text-2xl font-bold">Compte suspendu</h1>
      <p className="mt-3 max-w-md text-white/60">
        Ton compte vendeur a été suspendu par l&apos;administration. Contacte le support
        pour plus d&apos;informations.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/5"
        >
          Se déconnecter
        </button>
        <Link
          href="mailto:support@catalink.app"
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold hover:bg-violet-500"
        >
          Contacter le support
        </Link>
      </div>
    </main>
  );
}
