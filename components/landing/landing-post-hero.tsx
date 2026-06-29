import {
  BarChart3,
  ClipboardList,
  MessageCircle,
  Package,
  Share2,
  ShoppingBag,
  Store,
} from "lucide-react";

const FEATURE_CARDS = [
  {
    icon: Store,
    title: "Boutique en ligne",
    desc: "Crée une boutique simple et professionnelle en quelques minutes.",
    iconBg: "rgba(99,102,241,0.18)",
    iconColor: "text-violet-300",
  },
  {
    icon: MessageCircle,
    title: "Commandes centralisées",
    desc: "Toutes tes commandes WhatsApp regroupées au même endroit.",
    iconBg: "rgba(34,197,94,0.14)",
    iconColor: "text-green-400",
  },
  {
    icon: ClipboardList,
    title: "Clients & historique",
    desc: "Retrouve tes clients, leurs commandes et leur historique en 1 clic.",
    iconBg: "rgba(245,158,11,0.14)",
    iconColor: "text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Statistiques en temps réel",
    desc: "Suis tes ventes, ton chiffre d'affaires et ta croissance en direct.",
    iconBg: "rgba(59,130,246,0.14)",
    iconColor: "text-blue-400",
  },
] as const;

const STEPS = [
  {
    num: "1",
    icon: Share2,
    title: "Partage ta boutique",
    desc: "Envoie ton lien à tes clients ou ajoute-le à ta bio.",
  },
  {
    num: "2",
    icon: ShoppingBag,
    title: "Le client commande",
    desc: "Il choisit ses produits et valide sa demande simplement.",
  },
  {
    num: "3",
    icon: Package,
    title: "Tu gères tout au même endroit",
    desc: "Commandes, clients et suivi sont centralisés dans ton dashboard.",
  },
] as const;

const TAGS = [
  { label: "Vente en story", mobile: false },
  { label: "Commandes DM", mobile: true },
  { label: "Catalogue produit", mobile: false },
  { label: "Suivi client", mobile: true },
] as const;

const TITLE_GRADIENT =
  "bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent";

export function LandingPostHero() {
  return (
    <section id="apercu" className="relative bg-[#03030A] py-12 sm:py-14 lg:pb-20 lg:pt-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container relative mx-auto grid gap-4 px-4 sm:gap-8 sm:px-6 lg:max-w-7xl lg:grid-cols-2 lg:items-stretch lg:gap-12">
        <div className="flex flex-col lg:h-full">
          <div className="max-w-[22rem] sm:max-w-md lg:max-w-[28rem]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              SIMPLE, RAPIDE, PUISSANT
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
              Tout ce qu&apos;il te faut pour{" "}
              <span className={`whitespace-nowrap ${TITLE_GRADIENT}`}>
                vendre sans t&apos;éparpiller
              </span>
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-slate-300 sm:text-base lg:text-zinc-400">
              Catalogue, commandes, clients et statistiques : tout est centralisé dans un seul espace
              simple à gérer.
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:mt-7 lg:min-h-0 lg:flex-1 lg:grid-rows-2">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group lg:h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_0_40px_rgba(124,58,237,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(124,58,237,0.12)] sm:p-5"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)",
                  }}
                >
                  <div
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl sm:mb-3.5"
                    style={{ background: card.iconBg }}
                  >
                    <Icon size={20} className={card.iconColor} />
                  </div>
                  <h3 className="text-base font-bold text-white lg:text-zinc-100">{card.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-300 lg:text-sm lg:text-zinc-400">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative lg:h-full">
          <div
            className="pointer-events-none absolute -inset-3 rounded-3xl bg-violet-600/10 blur-3xl sm:-inset-4"
            aria-hidden
          />
          <div
            className="relative flex flex-col rounded-2xl border border-violet-500/20 bg-white/[0.03] p-4 shadow-[0_0_50px_rgba(124,58,237,0.1)] transition-shadow duration-200 hover:shadow-[0_0_60px_rgba(124,58,237,0.16)] sm:p-6 lg:h-full lg:min-h-0 lg:p-7"
            style={{
              backgroundImage:
                "linear-gradient(160deg, rgba(99,102,241,0.1) 0%, rgba(37,99,235,0.04) 40%, rgba(255,255,255,0.02) 100%)",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              PARFAIT POUR LES VENDEURS
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-[2rem] lg:leading-tight">
              Pensé pour les vendeurs qui prennent{" "}
              <span className={TITLE_GRADIENT}>leurs commandes en DM</span>
            </h2>
            <p className="mt-2.5 text-[13px] leading-6 text-slate-300 sm:mt-3 sm:text-[15px] lg:text-zinc-400">
              Que tu vendes sur Snapchat, TikTok, Instagram ou Telegram, Catalink t&apos;aide à
              transformer tes messages en commandes organisées.
            </p>

            <div className="mt-3 space-y-2.5 sm:space-y-3 lg:mt-6 lg:space-y-6">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.num} className="flex gap-3 sm:gap-4">
                    <div className="flex shrink-0 flex-col items-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-sm font-bold text-violet-300">
                        {step.num}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0 sm:pb-5">
                      <div className="flex items-center gap-2.5">
                        <Icon size={17} className="shrink-0 text-violet-400" />
                        <h3 className="text-base font-bold text-white lg:text-zinc-100">{step.title}</h3>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-6 text-slate-300 lg:mt-1.5 lg:text-sm lg:text-zinc-400">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col gap-2.5 pt-3 sm:gap-3 sm:pt-4 lg:gap-4 lg:pt-8">
              <p className="rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-3.5 py-2.5 text-[13px] leading-6 text-slate-300 sm:px-4 sm:py-3 sm:text-sm lg:py-3.5 lg:text-zinc-400">
                Pensé pour vendre vite, sans tableur, sans copier-coller, sans perdre tes commandes.
              </p>

              <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3 lg:hidden">
                {TAGS.filter((tag) => tag.mobile).map((tag) => (
                  <span
                    key={tag.label}
                    className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-300"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>

              <div className="hidden flex-wrap gap-2 border-t border-white/[0.06] pt-4 lg:flex lg:pt-5">
                {TAGS.map((tag) => (
                  <span
                    key={tag.label}
                    className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 sm:px-3.5"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
