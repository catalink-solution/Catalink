"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { APP_ERROR_ACTIONS } from "@/lib/app-error-log";
import { reportAppError } from "@/lib/report-app-error";

function loginErrorMessage(code: string | null): string | null {
  switch (code) {
    case "auth_callback":
      return "Le lien d'activation est invalide ou expiré. Utilise le lien reçu par email ou demande une nouvelle invitation.";
    case "session_expired":
      return "Ta session a expiré. Clique à nouveau sur le lien « Activer mon accès » dans l'email reçu.";
    case "invite_session":
      return "Active d'abord ton accès via le lien reçu par email avant de te connecter.";
    default:
      return null;
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlError = loginErrorMessage(searchParams.get("error"));
    if (urlError) setMessage(urlError);

    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router, searchParams]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    if (!isSupabaseConfigured()) {
      setMessage("Configuration Supabase manquante sur ce déploiement.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage("Email et mot de passe requis.");
      return;
    }

    setMessage("");
    setLoading(true);

    const supabase = getSupabaseBrowser();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        void reportAppError({
          action: APP_ERROR_ACTIONS.AUTH_LOGIN,
          message: error.message,
          metadata: { code: error.code, email: trimmedEmail },
        });
        setMessage(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : "Connexion impossible. Réessaie."
        );
        setLoading(false);
        return;
      }

      if (!data.session) {
        setMessage("Connexion impossible. Confirme ton email si tu viens de t'inscrire.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      void reportAppError({
        action: APP_ERROR_ACTIONS.AUTH_LOGIN,
        message: err instanceof Error ? err.message : "network_error",
        metadata: { email: trimmedEmail },
      });
      setMessage("Erreur réseau. Réessaie.");
      setLoading(false);
    }
  }

  return (
    <main className="login-page relative flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white">
      <div className="relative z-20 w-full max-w-md rounded-2xl border border-white/10 bg-[#030712] p-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Catalink
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Connexion</h1>
        <p className="mb-6 mt-1 text-sm text-white/50">Accède à ton tableau de bord.</p>

        <form
          onSubmit={handleLogin}
          method="post"
          noValidate
          aria-busy={loading}
          className="relative z-20 space-y-3"
        >
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              className="input login-field min-h-[48px] text-base"
              placeholder="Email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="block">
            <span className="sr-only">Mot de passe</span>
            <input
              className="input login-field min-h-[48px] text-base"
              placeholder="Mot de passe"
              type="password"
              name="password"
              autoComplete="current-password"
              enterKeyHint="go"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-touch relative z-20 w-full rounded-xl border-0 px-5 py-3.5 text-base font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        {message && (
          <p
            className="relative z-20 mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400"
            role="alert"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        <p className="relative z-20 mt-6 text-center text-sm text-white/50">
          Pas encore de compte ?{" "}
          <Link href="/waitlist" className="font-semibold text-violet-300 hover:text-violet-200">
            Demander un accès
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white/60">
          Chargement…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
