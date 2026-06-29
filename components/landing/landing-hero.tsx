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
    <section className="relative overflow-x-hidden bg-[#03030A] pt-20 pb-8 sm:pb-10 lg:min-h-[760px] lg:overflow-visible lg:pb-20 xl:min-h-[800px]">
      <LandingHeroBackground />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:max-w-7xl">
        <div className="grid items-center gap-3 sm:gap-8 lg:grid-cols-[42%_58%] lg:gap-6">
          <div className="order-1 pt-1 text-center sm:pt-4 lg:pt-16 lg:text-left">
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/35 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300 sm:mb-5 sm:text-xs lg:mb-6"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              BÊTA PRIVÉE • ACCÈS SUR INVITATION
            </div>

            <h1 className="text-[28px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl lg:text-[2.65rem] lg:leading-[1.06] xl:text-[2.85rem]">
              Centralise toutes tes{" "}
              <br className="hidden sm:block" />
              commandes Snapchat, TikTok, Telegram et Instagram{" "}
              <span className="bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                dans un seul dashboard
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-slate-300 sm:mt-5 sm:text-base lg:mx-0 lg:text-[15px] lg:leading-relaxed lg:text-zinc-400">
              Crée ta boutique, récupère les commandes sur WhatsApp{" "}
              <br className="hidden lg:block" />
              et gère tes clients sans Excel, sans messages perdus{" "}
              <br className="hidden lg:block" />
              et sans développeur.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:mt-6 lg:mt-7 lg:justify-start">
              <Link href="/waitlist" className="cta-primary w-full max-w-[240px] sm:w-auto sm:max-w-none">
                Demander un accès →
              </Link>
              <a href="#fonctionnement" className="cta-secondary w-full max-w-[240px] sm:w-auto sm:max-w-none">
                Voir comment ça fonctionne
              </a>
            </div>

            <div
              className="mx-auto mt-3 max-w-md rounded-2xl border border-violet-500/20 backdrop-blur-sm sm:mt-6 lg:mx-0 lg:mt-7"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 px-3 py-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 sm:gap-y-2 sm:px-4 sm:py-3.5 lg:justify-start lg:px-5">
                {TRUST_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center justify-center gap-2 sm:justify-start ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}
                    >
                      <Icon size={15} className={`shrink-0 ${item.tone}`} />
                      <span className="text-[11px] leading-snug text-slate-300 sm:text-xs">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="order-2 max-lg:-mt-0.5 lg:min-h-[680px]">
            <LandingHeroScene />
          </div>
        </div>
      </div>
    </section>
  );
}
