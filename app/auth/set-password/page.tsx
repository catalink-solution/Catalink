"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { PasswordInput } from "@/components/ui/password-input";

const MIN_PASSWORD_LENGTH = 8;

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
          router.replace("/login?error=session_expired");
          return;
        }
        setChecking(false);
      });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
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
        <h1 className="mt-6 text-2xl font-bold">Crée ton mot de passe</h1>
        <p className="mb-6 mt-1 text-sm text-white/50">
          Ton accès Catalink est prêt. Définis ton mot de passe pour finaliser ton compte.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <PasswordInput
            placeholder="Mot de passe *"
            name="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            placeholder="Confirmer le mot de passe *"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-touch w-full rounded-xl px-5 py-3 font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            {loading ? "Finalisation…" : "Finaliser mon accès"}
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
