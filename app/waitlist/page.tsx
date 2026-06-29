"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { CustomSelect } from "@/components/ui/custom-select";
import { WAITLIST_FIELD_LIMITS } from "@/lib/waitlist-limits";

const CHANNELS = [
  { value: "snapchat", label: "Snapchat" },
  { value: "telegram", label: "Telegram" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Autre" },
] as const;

function waitlistErrorMessage(error?: string): string {
  switch (error) {
    case "duplicate_email":
      return "Cette adresse email est déjà inscrite sur la liste d'attente.";
    case "duplicate_phone":
      return "Ce numéro est déjà inscrit.";
    case "invalid_phone":
      return "Numéro de téléphone invalide.";
    case "invalid_email":
      return "Adresse email invalide.";
    case "channel_other_required":
      return "Précise ton canal principal.";
    case "missing_fields":
      return "Tous les champs obligatoires doivent être remplis.";
    case "field_too_long":
      return "Un des champs est trop long.";
    case "invalid_channel":
      return "Canal invalide.";
    case "invalid_body":
      return "Demande invalide.";
    case "server_error":
      return "Une erreur est survenue. Réessaie dans quelques instants.";
    case "service_not_configured":
      return "Service temporairement indisponible.";
    default:
      return "Envoi impossible. Réessaie dans un instant.";
  }
}

export default function WaitlistPage() {
  const formStartedAt = useRef(Date.now());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [channel, setChannel] = useState("");
  const [channelOther, setChannelOther] = useState("");
  const [website, setWebsite] = useState("");
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
          phone: phone.trim(),
          shopName: shopName.trim(),
          channel,
          channelOther: channel === "other" ? channelOther.trim() : undefined,
          website,
          startedAt: formStartedAt.current,
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setMessage({ type: "err", text: waitlistErrorMessage(json.error) });
        return;
      }

      setMessage({
        type: "ok",
        text: "Demande enregistrée. Nous te recontactons dès qu'une place se libère.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setShopName("");
      setChannel("");
      setChannelOther("");
      setWebsite("");
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
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="waitlist-website">Website</label>
            <input
              id="waitlist-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <input
            className="input"
            placeholder="Ton nom *"
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={WAITLIST_FIELD_LIMITS.name}
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
            maxLength={WAITLIST_FIELD_LIMITS.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            aria-label="Téléphone WhatsApp"
            placeholder="+33 6 12 34 56 78"
            type="tel"
            name="phone"
            autoComplete="tel"
            required
            maxLength={WAITLIST_FIELD_LIMITS.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="input"
            placeholder="Nom de la boutique *"
            type="text"
            name="shopName"
            required
            maxLength={WAITLIST_FIELD_LIMITS.shopName}
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
              maxLength={WAITLIST_FIELD_LIMITS.channelOther}
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
