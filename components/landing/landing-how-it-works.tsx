import { ArrowRight, MessageCircle, Package, Settings, Share2 } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";

const STEPS = [
  {
    num: "01",
    icon: Settings,
    title: "Configure ta boutique",
    desc: "Nom, lien public et numéro WhatsApp — ta vitrine est prête en quelques minutes.",
    glow: "rgba(139,92,246,0.15)",
    border: "rgba(139,92,246,0.3)",
    bg: "from-violet-600/20 to-violet-800/10",
  },
  {
    num: "02",
    icon: Package,
    title: "Ajoute tes produits",
    desc: "Photos, prix, catégories : ton catalogue devient ta référence unique à partager.",
    glow: "rgba(99,102,241,0.15)",
    border: "rgba(99,102,241,0.3)",
    bg: "from-blue-600/20 to-indigo-800/10",
  },
  {
    num: "03",
    icon: Share2,
    title: "Reçois les commandes",
    desc: "Tes clients commandent depuis ta boutique. Chaque vente arrive dans ton dashboard.",
    glow: "rgba(6,182,212,0.15)",
    border: "rgba(6,182,212,0.3)",
    bg: "from-cyan-600/20 to-blue-800/10",
  },
  {
    num: "04",
    icon: MessageCircle,
    title: "Finalise le paiement sur WhatsApp",
    desc: "Pas de paiement intégré pour l'instant : tu confirmes et encaisses comme tu le fais déjà.",
    glow: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.25)",
    bg: "from-green-600/15 to-emerald-900/10",
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="fonctionnement"
      className="border-y border-[var(--surface-border)] py-20 sm:py-24"
      style={{ background: "rgba(255,255,255,0.012)" }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          label="Comment ça marche"
          title="Quatre étapes pour structurer tes ventes"
          description="Catalink s'intègre à ton workflow existant. WhatsApp reste ton canal de paiement — Catalink structure tout le reste."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative">
                <div
                  className="h-full rounded-2xl border p-6"
                  style={{
                    background: `radial-gradient(ellipse 80% 60% at 30% 20%, ${step.glow}, transparent 70%), rgba(255,255,255,0.03)`,
                    borderColor: step.border,
                    boxShadow: `0 0 40px -15px ${step.glow}`,
                  }}
                >
                  <div
                    className="mb-4 inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                    style={{ background: "rgba(99,102,241,.12)", color: "rgba(165,180,252,.7)" }}
                  >
                    Étape {step.num}
                  </div>
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br ${step.bg}`}
                    style={{ borderColor: step.border }}
                  >
                    <Icon size={26} className="text-violet-200" />
                  </div>
                  <h3 className="mb-2 font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight
                    size={18}
                    className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-violet-400/70 lg:block"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
