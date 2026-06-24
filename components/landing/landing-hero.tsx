import Link from "next/link";
import { CreditCard, MessageCircle, Sparkles } from "lucide-react";
import { LandingHeroBackground } from "@/components/landing/landing-hero-background";
import { LandingHeroScene } from "@/components/landing/landing-hero-scene";

const TRUST_ITEMS = [
  { icon: Sparkles, label: "Bêta privée", tone: "text-violet-300" },
  { icon: MessageCircle, label: "Commandes via WhatsApp", tone: "text-green-400" },
  { icon: CreditCard, label: "Aucune carte bancaire requise", tone: "text-green-400" },
] as const;

export function LandingHero() {
  return (
    <section className="relative bg-[#03030A] pt-[58px] pb-16 sm:pb-20 lg:min-h-[760px] xl:min-h-[800px]">
      <LandingHeroBackground />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[42%_58%] lg:gap-6">
          <div className="order-1 pt-10 text-center lg:pt-16 lg:text-left">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/35 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300 sm:text-xs"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              BÊTA PRIVÉE • ACCÈS SUR INVITATION
            </div>

            <h1 className="text-[1.75rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-3xl lg:text-[2.65rem] xl:text-[2.85rem]">
              Centralise toutes tes
              <br className="hidden sm:block" />
              commandes Snapchat, TikTok, Telegram et Instagram{" "}
              <span className="bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                dans un seul dashboard
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base lg:mx-0 lg:text-[15px] lg:leading-relaxed">
              Crée ta boutique, récupère les commandes sur WhatsApp
              <br className="hidden lg:block" />
              et gère tes clients sans Excel, sans messages perdus
              <br className="hidden lg:block" />
              et sans développeur.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/waitlist" className="cta-primary">
                Demander un accès →
              </Link>
              <a href="#fonctionnement" className="cta-secondary">
                Voir comment ça fonctionne
              </a>
            </div>

            <div
              className="mx-auto mt-7 max-w-md rounded-2xl border border-violet-500/20 lg:mx-0"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-3.5 lg:justify-start lg:px-5">
                {TRUST_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <Icon size={13} className={`shrink-0 ${item.tone}`} />
                      <span className="text-[10px] text-zinc-300 sm:text-[11px]">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="order-2 lg:min-h-[680px]">
            <LandingHeroScene />
          </div>
        </div>
      </div>
    </section>
  );
}
