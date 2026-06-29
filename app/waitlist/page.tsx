"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { CustomSelect } from "@/components/ui/custom-select";

const CHANNELS = [
  { value: "snapchat", label: "Snapchat" },
  { value: "telegram", label: "Telegram" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Autre" },
] as const;

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [channel, setChannel] = useState("");
  const [channelOther, setChannelOther] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          shopName: shopName.trim(),
          channel,
          channelOther: channel === "other" ? channelOther.trim() : undefined,
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        const errText =
          json.error === "duplicate_email"
            ? "Cette adresse email est déjà inscrite sur la liste d'attente."
            : json.error === "invalid_email"
            ? "Adresse email invalide."
            : json.error === "channel_other_required"
              ? "Précise ton canal principal."
              : json.error === "missing_fields"
                ? "Tous les champs obligatoires doivent être remplis."
                : "Envoi impossible. Réessaie dans un instant.";
        setMessage({ type: "err", text: errText });
        return;
      }

      setMessage({
        type: "ok",
        text: "Demande enregistrée. Nous te recontactons dès qu'une place se libère.",
      });
      setName("");
      setEmail("");
      setShopName("");
      setChannel("");
      setChannelOther("");
    } catch {
      setMessage({ type: "err", text: "Erreur réseau. Réessaie." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm text-white/40 transition-colors hover:text-white/70"
        >
          ← Retour à l&apos;accueil
        </Link>

        <div className="flex flex-col items-center gap-2.5">
          <Link href="/" className="flex shrink-0 items-center justify-center">
            <Image
              src="/catalink-logo-v3.png"
              alt="Catalink"
              width={280}
              height={96}
              className="h-12 w-auto max-w-full object-contain sm:h-14"
              priority
            />
          </Link>
          <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-violet-300">
            Bêta privée
          </span>
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">
          Rejoins la bêta privée Catalink
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-white/70">
          Catalink est actuellement en accès privé. Remplis le formulaire, on te recontacte
          pour ouvrir ton espace vendeur.
        </p>
        <p className="mb-6 mt-2 text-center text-sm text-white/45">
          Laisse tes coordonnées, on te contacte dès qu&apos;un accès est disponible pour ta
          boutique.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <input
            className="input"
            placeholder="Ton nom *"
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Email *"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            placeholder="Nom de la boutique *"
            type="text"
            name="shopName"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <CustomSelect
            name="channel"
            required
            value={channel}
            onChange={setChannel}
            placeholder="Canal principal *"
            options={CHANNELS.map((c) => ({ value: c.value, label: c.label }))}
          />
          {channel === "other" && (
            <input
              className="input"
              placeholder="Précise ton canal *"
              type="text"
              name="channelOther"
              required
              value={channelOther}
              onChange={(e) => setChannelOther(e.target.value)}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-touch w-full rounded-xl px-5 py-3 font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            {loading ? "Envoi…" : "Envoyer ma demande"}
          </button>

          <p className="pt-1 text-center text-xs text-white/35">
            Aucune carte bancaire requise · Réponse sous 24/48h
          </p>
        </form>

        {message && (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              message.type === "ok"
                ? "bg-green-500/10 text-green-300"
                : "bg-red-500/10 text-red-300"
            }`}
            role="status"
          >
            {message.text}
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
