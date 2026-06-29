"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setMessage("Configuration Supabase manquante.");
      setChecking(false);
      return;
    }

    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          router.replace("/login?error=invite_session");
          return;
        }
        setChecking(false);
      });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      setMessage("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setMessage("Erreur réseau. Réessaie.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white/60">
        Préparation de ton accès…
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Catalink
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Active ton accès</h1>
        <p className="mb-6 mt-1 text-sm text-white/50">
          Définis ton mot de passe pour accéder à ton espace vendeur Catalink.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <input
            className="input"
            placeholder="Nouveau mot de passe *"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="input"
            placeholder="Confirmer le mot de passe *"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-touch w-full rounded-xl px-5 py-3 font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            {loading ? "Enregistrement…" : "Créer mon mot de passe"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300" role="status">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
