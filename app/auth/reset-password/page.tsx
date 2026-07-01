"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import {
  establishSessionFromUrl,
  mapPasswordUpdateError,
} from "@/lib/auth-recovery";
import { APP_ERROR_ACTIONS } from "@/lib/app-error-log";
import { reportAppError } from "@/lib/report-app-error";
import { PasswordInput } from "@/components/ui/password-input";

const MIN_PASSWORD_LENGTH = 8;

type PageState = "loading" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setPageState("ready");
      }
    });

    async function initSession() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setPageState("invalid");
        return;
      }

      const result = await establishSessionFromUrl(supabase);
      if (cancelled) return;

      if (result === "error" || result === "none") {
        setPageState("invalid");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userError || !user) {
        setPageState("invalid");
        return;
      }

      setPageState("ready");
    }

    void initSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const formValid =
    password.length >= MIN_PASSWORD_LENGTH &&
    confirm.length >= MIN_PASSWORD_LENGTH &&
    password === confirm;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || success || pageState !== "ready") return;

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

      await supabase.auth.refreshSession();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Ta session a expiré. Demande un nouveau lien.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        void reportAppError({
          action: APP_ERROR_ACTIONS.AUTH_PASSWORD_RESET_UPDATE,
          message: error.message,
          metadata: { code: error.code },
        });
        setMessage(mapPasswordUpdateError(error.message, error.code));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      void reportAppError({
        action: APP_ERROR_ACTIONS.AUTH_PASSWORD_RESET_UPDATE,
        message: err instanceof Error ? err.message : "network_error",
      });
      setMessage("Impossible de mettre à jour le mot de passe. Réessaie ou demande un nouveau lien.");
      setLoading(false);
    }
  }

  if (pageState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white/60">
        Préparation de la réinitialisation…
      </main>
    );
  }

  if (pageState === "invalid") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white">
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            Catalink
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Lien expiré ou invalide</h1>
          <p className="mb-6 mt-1 text-sm text-white/50">
            Demande un nouveau lien pour réinitialiser ton mot de passe.
          </p>
          <Link
            href="/auth/forgot-password"
            className="btn-touch inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-bold text-white"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            Demander un nouveau lien
          </Link>
          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="text-violet-300 hover:text-violet-200">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Catalink
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Nouveau mot de passe</h1>
        <p className="mb-6 mt-1 text-sm text-white/50">
          Choisis un mot de passe sécurisé pour ton compte Catalink.
        </p>

        {success ? (
          <p className="rounded-xl bg-green-500/10 px-3 py-2 text-sm text-green-300" role="status">
            Mot de passe mis à jour. Redirection vers ton tableau de bord…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <PasswordInput
              placeholder="Nouveau mot de passe *"
              name="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || pageState !== "ready"}
            />
            <PasswordInput
              placeholder="Confirmer le mot de passe *"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading || pageState !== "ready"}
            />
            <button
              type="submit"
              disabled={loading || pageState !== "ready" || !formValid}
              className="btn-touch w-full rounded-xl px-5 py-3 font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
            >
              {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
