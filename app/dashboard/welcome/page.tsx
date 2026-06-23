"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Package,
  Share2,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useVendorOnboarding } from "@/components/dashboard/use-vendor-onboarding";
import { markStorefrontShared } from "@/lib/onboarding-storage";
import { nextIncompleteStep } from "@/lib/vendor-onboarding";
import type { OnboardingStepId } from "@/lib/vendor-onboarding";

const STEP_ICONS: Record<OnboardingStepId, React.ReactNode> = {
  shop: <Store size={18} />,
  whatsapp: <MessageCircle size={18} />,
  product: <Package size={18} />,
  order: <ShoppingBag size={18} />,
  share: <Share2 size={18} />,
};

export default function WelcomePage() {
  const { loading, steps, progress, complete, shopSlug, refresh } = useVendorOnboarding();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const next = nextIncompleteStep(steps);
  const shopUrl = shopSlug && origin ? `${origin}/${shopSlug}` : null;

  function handleShareAction() {
    markStorefrontShared();
    refresh();
  }

  async function copyShopLink() {
    if (!shopUrl) return;
    await navigator.clipboard.writeText(shopUrl);
    markStorefrontShared();
    setCopied(true);
    refresh();
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <main className="p-4 sm:p-6 md:p-10">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        Bienvenue sur Catalink
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-white/55 sm:text-base">
        Catalink te permet de créer une boutique en ligne, recevoir des commandes via WhatsApp et
        gérer tout depuis un seul dashboard — sans paiement intégré, en direct avec tes clients.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/80">Progression de configuration</p>
            <p className="mt-1 text-3xl font-extrabold text-violet-300">{progress}%</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 sm:max-w-xs">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {complete && (
          <p className="mt-4 text-sm text-green-300">
            Configuration terminée — ta boutique est prête !
          </p>
        )}
        {!complete && next && (
          <Link
            href={next.href}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500"
          >
            Prochaine étape : {next.label} <ArrowRight size={15} />
          </Link>
        )}
      </div>

      <ol className="mt-8 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`rounded-2xl border p-4 sm:p-5 ${
              step.complete
                ? "border-green-500/20 bg-green-500/5"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    step.complete ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/50"
                  }`}
                >
                  {step.complete ? <Check size={18} /> : STEP_ICONS[step.id]}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                    Étape {index + 1} · {(index + 1) * 20}%
                  </p>
                  <p className="font-bold text-white">{step.label}</p>
                  <p className="mt-1 text-sm text-white/50">{step.description}</p>
                </div>
              </div>
              {!step.complete && step.id !== "share" && (
                <Link
                  href={step.href}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Configurer <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      {shopUrl && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-bold">Partager ta boutique</h2>
          <p className="mt-1 text-sm text-white/50">
            Copie ce lien dans ta bio Snapchat, TikTok ou Telegram.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-violet-200">
              {shopUrl}
            </code>
            <button
              type="button"
              onClick={copyShopLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copié" : "Copier le lien"}
            </button>
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShareAction}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"
            >
              <ExternalLink size={16} /> Ouvrir
            </a>
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <QuickLink href="/dashboard/shop" label="Ma boutique" />
        <QuickLink href="/dashboard/products" label="Produits" />
        <QuickLink href="/dashboard/orders" label="Commandes" />
      </div>

      <p className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-white/40 hover:text-white">
          Aller au dashboard →
        </Link>
      </p>
    </main>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm font-semibold hover:bg-white/5"
    >
      {label}
    </Link>
  );
}
