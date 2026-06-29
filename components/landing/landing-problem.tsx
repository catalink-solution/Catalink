import {
  CreditCard,
  HelpCircle,
  LayoutGrid,
  MessageCircleWarning,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { SectionHeading } from "@/components/landing/section-heading";

const TITLE_HIGHLIGHT =
  "bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent";

const RIBBON_BASE =
  "absolute right-2 top-2 inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-tight text-white backdrop-blur-md sm:px-3.5 sm:py-1.5 sm:text-[11px]";

const BADGE_ACCENTS = {
  red: "bg-red-500/25 border-red-200/65 shadow-[0_0_18px_rgba(248,113,113,0.22)]",
  amber: "bg-amber-500/25 border-amber-200/65 shadow-[0_0_18px_rgba(251,191,36,0.22)]",
  violet: "bg-violet-500/25 border-violet-200/65 shadow-[0_0_18px_rgba(168,85,247,0.22)]",
  rose: "bg-rose-500/25 border-rose-200/65 shadow-[0_0_18px_rgba(244,114,182,0.22)]",
  fuchsia: "bg-fuchsia-500/25 border-fuchsia-200/65 shadow-[0_0_18px_rgba(217,70,239,0.22)]",
} as const;

const PROBLEMS = [
  {
    id: "commandes-dm",
    icon: MessageCircleWarning,
    title: (
      <>
        Commandes{" "}
        <span className={TITLE_HIGHLIGHT}>perdues</span> dans les DM
      </>
    ),
    description:
      "Les messages s'accumulent, les demandes se mélangent, et certaines commandes passent à la trappe.",
    badge: "DM perdu",
    badgeClass: BADGE_ACCENTS.red,
    iconWrap:
      "bg-red-500/10 border-red-400/25 text-red-300 shadow-[0_0_30px_rgba(248,113,113,0.18)] group-hover:border-red-400/40 group-hover:shadow-[0_0_36px_rgba(248,113,113,0.28)]",
    cardHover:
      "hover:border-red-400/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(239,68,68,0.08)]",
    cardGradient:
      "linear-gradient(145deg, rgba(239,68,68,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 100%)",
    bubble: {
      src: "/landing/problem/bubbles/bulle-toujours-dispo.png",
      alt: "Message client : Toujours dispo ?",
      width: 320,
      height: 120,
      imageClass: "w-[220px]",
      imageShadow: "drop-shadow-[0_6px_22px_rgba(248,113,113,0.22)]",
      rotate: "-3deg",
      delay: "0s",
      wrapperClass: "",
    },
  },
  {
    id: "prix-redemandent",
    icon: HelpCircle,
    title: (
      <>
        Clients qui <span className={TITLE_HIGHLIGHT}>redemandent</span> le prix
      </>
    ),
    description: "Sans catalogue clair, tu répètes les mêmes infos encore et encore.",
    badge: "À répéter",
    badgeClass: BADGE_ACCENTS.amber,
    iconWrap:
      "bg-amber-500/10 border-amber-400/25 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.16)] group-hover:border-amber-400/40 group-hover:shadow-[0_0_36px_rgba(251,191,36,0.26)]",
    cardHover:
      "hover:border-amber-400/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(251,191,36,0.07)]",
    cardGradient:
      "linear-gradient(145deg, rgba(245,158,11,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 100%)",
    bubble: {
      src: "/landing/problem/bubbles/bulle-cest-combien.png",
      alt: "Message client : C'est combien ?",
      width: 320,
      height: 120,
      imageClass: "w-[220px]",
      imageShadow: "drop-shadow-[0_6px_22px_rgba(251,191,36,0.20)]",
      rotate: "2deg",
      delay: "0.8s",
      wrapperClass: "mx-auto w-fit sm:mx-0",
    },
  },
  {
    id: "stocks",
    icon: LayoutGrid,
    title: (
      <>
        Stocks <span className={TITLE_HIGHLIGHT}>difficiles</span> à suivre
      </>
    ),
    description:
      "Tu jongles entre notes, captures et conversations pour savoir ce qu'il reste.",
    badge: "Stock ?",
    badgeClass: BADGE_ACCENTS.violet,
    iconWrap:
      "bg-violet-500/10 border-violet-400/25 text-violet-300 shadow-[0_0_30px_rgba(139,92,246,0.18)] group-hover:border-violet-400/40 group-hover:shadow-[0_0_36px_rgba(139,92,246,0.28)]",
    cardHover:
      "hover:border-violet-400/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]",
    cardGradient:
      "linear-gradient(145deg, rgba(139,92,246,0.07) 0%, rgba(239,68,68,0.03) 40%, rgba(255,255,255,0.02) 100%)",
    bubble: {
      src: "/landing/problem/bubbles/bulle-quelle-taille.png",
      alt: "Message client : Il reste quelle taille ?",
      width: 320,
      height: 120,
      imageClass: "w-[240px]",
      imageShadow: "drop-shadow-[0_6px_22px_rgba(139,92,246,0.22)]",
      rotate: "-2deg",
      delay: "1.2s",
      wrapperClass: "",
    },
  },
  {
    id: "paiements",
    icon: CreditCard,
    title: (
      <>
        Paiements suivis <span className={TITLE_HIGHLIGHT}>manuellement</span>
      </>
    ),
    description: "Chaque vente demande une vérification à la main, sans vue d'ensemble.",
    badge: "À vérifier",
    badgeClass: BADGE_ACCENTS.rose,
    iconWrap:
      "bg-rose-500/10 border-rose-400/25 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.16)] group-hover:border-rose-400/40 group-hover:shadow-[0_0_36px_rgba(244,63,94,0.26)]",
    cardHover:
      "hover:border-rose-400/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(244,63,94,0.07)]",
    cardGradient:
      "linear-gradient(145deg, rgba(244,63,94,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 100%)",
    bubble: {
      src: "/landing/problem/bubbles/bulle-virement-envoye.png",
      alt: "Message client : Je t'ai envoyé le virement",
      width: 320,
      height: 120,
      imageClass: "w-[260px]",
      imageShadow: "drop-shadow-[0_6px_22px_rgba(244,63,94,0.22)]",
      rotate: "2deg",
      delay: "0.4s",
      wrapperClass: "",
    },
  },
  {
    id: "vitrine",
    icon: MessageSquare,
    title: (
      <>
        Aucun espace <span className={TITLE_HIGHLIGHT}>pro</span> pour tes produits
      </>
    ),
    description: "Tes offres restent éparpillées dans les stories et les fils de discussion.",
    badge: "Pas de vitrine",
    badgeClass: BADGE_ACCENTS.fuchsia,
    iconWrap:
      "bg-fuchsia-500/10 border-fuchsia-400/25 text-fuchsia-300 shadow-[0_0_30px_rgba(217,70,239,0.16)] group-hover:border-fuchsia-400/35 group-hover:shadow-[0_0_36px_rgba(217,70,239,0.24)]",
    cardHover:
      "hover:border-fuchsia-400/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(217,70,239,0.07)]",
    cardGradient:
      "linear-gradient(145deg, rgba(217,70,239,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 100%)",
    bubble: {
      src: "/landing/problem/bubbles/bulle-renvoyer-photos.png",
      alt: "Message client : Tu peux me renvoyer les photos ?",
      width: 320,
      height: 120,
      imageClass: "w-[280px]",
      imageShadow: "drop-shadow-[0_6px_22px_rgba(217,70,239,0.22)]",
      rotate: "-2deg",
      delay: "1s",
      wrapperClass: "mx-auto w-fit sm:mx-0",
    },
  },
] as const;

function ProblemBubbleImage({
  bubble,
}: {
  bubble: (typeof PROBLEMS)[number]["bubble"];
}) {
  return (
    <div
      className={`catalink-problem-bubble mx-auto mt-auto max-w-[85%] pt-3 pointer-events-none sm:max-w-full sm:pt-6 ${bubble.wrapperClass}`}
      style={
        {
          "--bubble-rotate": bubble.rotate,
          animationDelay: bubble.delay,
        } as React.CSSProperties
      }
    >
      <Image
        src={bubble.src}
        alt={bubble.alt}
        width={bubble.width}
        height={bubble.height}
        unoptimized
        className={`h-auto max-w-full object-contain ${bubble.imageClass} ${bubble.imageShadow}`}
      />
    </div>
  );
}

export function LandingProblem() {
  return (
    <section id="probleme" className="relative py-12 sm:py-14 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 30% 0%, rgba(239,68,68,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container relative mx-auto px-4 sm:px-6">
        <SectionHeading
          label="Le problème"
          title={
            <>
              Vendre par messages devient
              <br />
              <span className="gradient-text">vite ingérable</span>
            </>
          }
          description="Le social commerce fonctionne — jusqu'au moment où le volume de messages dépasse ce que tu peux suivre à la main."
        />

        <div className="mt-6 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:mt-12 lg:grid-cols-3">
          {PROBLEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_0_40px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 sm:p-6 ${item.cardHover}`}
                style={{ backgroundImage: item.cardGradient }}
              >
                <span className={`${RIBBON_BASE} ${item.badgeClass}`}>{item.badge}</span>

                <div className="mb-3 sm:mb-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-shadow duration-200 sm:h-14 sm:w-14 ${item.iconWrap}`}
                  >
                    <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.25} />
                  </div>
                </div>

                <h3 className="mb-1.5 text-base font-bold leading-snug text-white sm:mb-2 sm:text-lg">{item.title}</h3>
                <p className="text-[13px] leading-6 text-slate-300 sm:leading-relaxed lg:text-sm lg:text-zinc-400">{item.description}</p>
                <ProblemBubbleImage bubble={item.bubble} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
