import Link from "next/link";
import { CheckCircle2, Clock, CreditCard, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";

const PLANS = [
  {
    name: "Starter",
    badge: "Bêta active",
    headline: "Gratuit pendant la bêta",
    available: true,
    features: [
      "Boutique en ligne personnalisée",
      "Jusqu'à 50 produits",
      "Commandes centralisées",
      "Notifications WhatsApp",
      "Support email",
    ],
  },
  {
    name: "Pro",
    badge: "Après bêta",
    headline: "Disponible après la bêta",
    available: false,
    features: [
      "Tout dans Starter",
      "Produits illimités",
      "Réponses rapides illimitées",
      "Statistiques avancées",
      "Priorité support",
    ],
  },
  {
    name: "Business",
    badge: "Après bêta",
    headline: "Disponible après la bêta",
    available: false,
    features: [
      "Tout dans Pro",
      "Gestion multi-boutiques",
      "Équipe & rôles",
      "API & intégrations à venir",
      "Accompagnement dédié",
    ],
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Sans engagement" },
  { icon: CreditCard, label: "Aucune carte bancaire" },
  { icon: Clock, label: "Accès après validation" },
];

export function LandingPricing() {
  return (
    <section id="tarifs" className="border-t border-[var(--surface-border)] py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          label="Tarifs"
          title="Une grille de positionnement claire"
          description="Les plans Pro et Business arrivent après la bêta. Aujourd'hui, l'accès se fait sur invitation — sans paiement en ligne."
          align="center"
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[1fr_300px] lg:items-start xl:grid-cols-[1fr_320px]">
          <div className="grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="relative flex flex-col rounded-2xl border p-6 text-left sm:p-7"
                style={
                  plan.available
                    ? {
                        background: "rgba(99,102,241,.07)",
                        borderColor: "rgba(99,102,241,.45)",
                        boxShadow: "0 0 40px -10px rgba(79,70,229,.3)",
                      }
                    : { background: "var(--surface)", borderColor: "rgba(255,255,255,.08)" }
                }
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                    {plan.name}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={
                      plan.available
                        ? { background: "rgba(34,197,94,0.15)", color: "#86efac" }
                        : { background: "rgba(255,255,255,0.06)", color: "#a1a1aa" }
                    }
                  >
                    {plan.badge}
                  </span>
                </div>

                <p
                  className={`mb-5 text-xl font-extrabold tracking-tight sm:text-2xl ${
                    plan.available ? "text-violet-200" : "text-zinc-400"
                  }`}
                >
                  {plan.headline}
                </p>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <CheckCircle2
                        size={15}
                        className={`mt-0.5 shrink-0 ${plan.available ? "text-indigo-400" : "text-zinc-600"}`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.available && (
                  <Link href="/waitlist" className="cta-primary w-full text-center text-sm">
                    Demander un accès
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl border p-6 sm:p-7 lg:sticky lg:top-24"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(99,102,241,0.25)",
              boxShadow: "0 0 40px -15px rgba(79,70,229,0.25)",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
              Accès bêta sur validation
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              La bêta est gratuite pour une durée limitée. L&apos;accès se fait uniquement sur
              invitation.
            </p>

            <Link href="/waitlist" className="cta-primary mt-6 w-full text-center text-sm">
              Demander un accès
            </Link>

            <div className="mt-6 space-y-2.5">
              {TRUST_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-zinc-300"
                  >
                    <Icon size={14} className="shrink-0 text-violet-300" />
                    {badge.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
