"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e?: FormEvent) {
    e?.preventDefault();
    if (loading) return;

    if (!isSupabaseConfigured()) {
      setMessage("Configuration Supabase manquante sur ce déploiement.");
      return;
    }

    if (password.length < 6) {
      setMessage("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        window.location.assign("/dashboard");
        return;
      }

      setMessage("Compte créé. Vérifie ton email pour confirmer, puis connecte-toi.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Catalink
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Créer un compte</h1>
        <p className="mb-6 mt-1 text-sm text-white/50">Lance ta boutique en quelques minutes.</p>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleRegister();
          }}
          className="space-y-3"
        >
          <input
            className="input"
            placeholder="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            placeholder="Mot de passe (min. 6 caractères)"
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleRegister()}
            className="btn-touch w-full rounded-xl px-5 py-3 font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            {loading ? "Création…" : "S'inscrire"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70" role="status">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-white/50">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-violet-300 hover:text-violet-200">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
