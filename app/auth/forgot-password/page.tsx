"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { getResetPasswordRedirectUrl } from "@/lib/auth-recovery";
import { APP_ERROR_ACTIONS } from "@/lib/app-error-log";
import { reportAppError } from "@/lib/report-app-error";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || submitted) return;

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("L'email est obligatoire.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError("Adresse email invalide.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Configuration Supabase manquante sur ce déploiement.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getResetPasswordRedirectUrl(),
      });

      if (resetError) {
        void reportAppError({
          action: APP_ERROR_ACTIONS.AUTH_PASSWORD_RESET_REQUEST,
          message: resetError.message,
          metadata: { code: resetError.code, email: trimmed },
        });
        setError("Impossible d'envoyer le lien pour le moment. Réessaie plus tard.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      void reportAppError({
        action: APP_ERROR_ACTIONS.AUTH_PASSWORD_RESET_REQUEST,
        message: err instanceof Error ? err.message : "network_error",
        metadata: { email: trimmed },
      });
      setError("Impossible d'envoyer le lien pour le moment. Réessaie plus tard.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Catalink
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Réinitialiser ton mot de passe</h1>
        <p className="mb-6 mt-1 text-sm text-white/50">
          Entre ton email, on t&apos;envoie un lien pour créer un nouveau mot de passe.
        </p>

        {submitted ? (
          <p className="rounded-xl bg-green-500/10 px-3 py-2 text-sm text-green-300" role="status">
            Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <input
              className="input min-h-[48px] text-base"
              placeholder="Email"
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-touch w-full rounded-xl px-5 py-3 font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-violet-300 hover:text-violet-200">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
