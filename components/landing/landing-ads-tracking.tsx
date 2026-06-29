import { ArrowRight, Link2, Megaphone, TrendingUp } from "lucide-react";

const TITLE_GRADIENT =
  "bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent";

const STEPS = [
  {
    num: 1,
    icon: Megaphone,
    title: "Crée ta campagne",
    mobileTitle: "Crée ta campagne",
    desc: "Ajoute l'influenceur, le budget payé et les produits à pousser.",
    mobileDesc: "Ajoute l'influenceur et ton budget.",
  },
  {
    num: 2,
    icon: Link2,
    title: "Partage son lien tracké",
    mobileTitle: "Partage son lien",
    desc: "Chaque créateur reçoit un lien unique vers ta boutique.",
    mobileDesc: "Chaque créateur reçoit son lien unique.",
  },
  {
    num: 3,
    icon: TrendingUp,
    title: "Analyse le ROI réel",
    mobileTitle: "Analyse le ROI",
    desc: "Catalink te montre les clics, les ventes, le chiffre d'affaires et le coût par commande.",
    mobileDesc: "Clics, commandes, CA et coût par vente.",
  },
] as const;

const CAMPAIGN_STATS = [
  { label: "Budget pub", value: "1 500 €", highlight: false },
  { label: "Clics", value: "8 240", highlight: false },
  { label: "Commandes", value: "96", highlight: true },
  { label: "CA généré", value: "7 680 €", highlight: true },
  { label: "Coût / commande", value: "15,62 €", highlight: true },
] as const;

const INFLUENCER_ROWS = [
  { handle: "@nasdas", roi: "x5.12", orders: 96, positive: true },
  { handle: "@snapmode", roi: "x2.4", orders: 41, positive: true },
  { handle: "@streetdeal", roi: "x0.8", orders: 12, positive: false },
] as const;

function CampaignDashboard() {
  const roiPercent = 85;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-[0_0_80px_rgba(124,58,237,0.08)] backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(37,99,235,0.04) 40%, rgba(255,255,255,0.02) 100%)",
      }}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">catalink.app/campagnes</span>
        <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 sm:inline lg:text-[10px]">
          Campagne active
        </span>
      </div>

      <div className="space-y-3 p-4 lg:space-y-4 lg:p-6">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 lg:hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">
            ROI campagne · Nasdas
          </p>
          <p className="text-[2.5rem] font-extrabold tabular-nums leading-none text-emerald-50">x5,12</p>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Campagne influenceur
            </p>
            <p className="mt-1 text-lg font-extrabold text-white sm:text-xl">Nasdas</p>
          </div>
          <div className="hidden rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-right shadow-[0_0_28px_rgba(52,211,153,0.12)] lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90">
              ROI
            </p>
            <p className="text-[1.65rem] font-extrabold tabular-nums leading-none text-emerald-200 sm:text-[2rem]">
              x5,12
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-3">
          {CAMPAIGN_STATS.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border p-3 lg:px-4 lg:py-3 ${
                stat.label === "Coût / commande" ? "hidden lg:block" : ""
              } ${
                stat.highlight
                  ? "border-violet-400/15 bg-violet-500/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <p className="text-xs font-semibold text-slate-200 lg:font-medium lg:text-[10px] lg:text-zinc-500">
                {stat.label === "CA généré" ? (
                  <>
                    <span className="lg:hidden">CA</span>
                    <span className="hidden lg:inline">CA généré</span>
                  </>
                ) : stat.label === "Budget pub" ? (
                  <>
                    <span className="lg:hidden">Budget</span>
                    <span className="hidden lg:inline">Budget pub</span>
                  </>
                ) : (
                  stat.label
                )}
              </p>
              <p
                className={`mt-1 font-bold tabular-nums ${
                  stat.highlight
                    ? "text-base text-white lg:text-lg"
                    : "text-base text-slate-100 lg:text-zinc-100"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="font-medium text-zinc-400">Performance vs budget</span>
            <span className="font-semibold text-emerald-300">+412 %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-emerald-400"
              style={{ width: `${roiPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 lg:hidden">
            <span className="min-w-0 truncate text-[13px] font-semibold text-slate-100">@nasdas</span>
            <span className="shrink-0 text-[13px] font-bold tabular-nums text-emerald-300">x5.12</span>
            <span className="shrink-0 text-[13px] tabular-nums text-slate-200">96 cmd.</span>
          </div>

          <div className="hidden lg:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Comparatif privé
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 sm:px-4">
                <span>Influenceur</span>
                <span className="text-right">ROI</span>
                <span className="text-right">Commandes</span>
              </div>
              {INFLUENCER_ROWS.map((row) => (
                <div
                  key={row.handle}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-white/[0.04] px-3 py-3 last:border-b-0 sm:gap-3 sm:px-4"
                >
                  <span className="text-sm font-semibold text-zinc-200">{row.handle}</span>
                  <span
                    className={`text-right text-sm font-bold tabular-nums ${
                      row.positive ? "text-emerald-300" : "text-orange-400"
                    }`}
                  >
                    {row.roi}
                  </span>
                  <span className="text-right text-sm tabular-nums text-zinc-400">{row.orders}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingAdsTracking() {
  return (
    <section id="tracking" className="relative overflow-hidden py-12 sm:py-14 lg:pb-24 lg:pt-20">
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container relative mx-auto grid gap-5 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
            TRACKING INFLUENCEURS
          </p>
          <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Arrête de payer des{" "}
            <span className={TITLE_GRADIENT}>pubs à l&apos;aveugle</span>
          </h2>
          <p className="mt-3 max-w-lg text-[13px] leading-6 text-slate-300 sm:text-base lg:text-zinc-400">
            Génère un lien unique pour chaque influenceur, suis les clics, les commandes et le
            chiffre d&apos;affaires généré par chaque campagne.
          </p>
          <p className="mt-2 text-sm font-semibold text-violet-200 sm:mt-3 sm:text-[15px]">
            Les vues ne paient pas tes factures. Les ventes, oui.
          </p>

          <ol className="mt-4 space-y-1 lg:mt-6 lg:space-y-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex items-center gap-2 py-0.5 lg:gap-3.5 lg:rounded-2xl lg:border lg:border-white/[0.06] lg:bg-white/[0.02] lg:px-2.5 lg:py-2 lg:transition-colors lg:duration-200 lg:hover:border-violet-400/20 lg:hover:bg-white/[0.04] lg:p-4"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300/35 bg-gradient-to-br from-violet-500/25 to-blue-500/15 text-xs font-bold text-white lg:h-10 lg:w-10 lg:text-sm">
                    {step.num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className="hidden shrink-0 text-violet-300 lg:block" />
                      <h3 className="text-[13px] font-bold text-slate-100 lg:text-sm lg:text-zinc-100">
                        <span className="lg:hidden">{step.mobileTitle}</span>
                        <span className="hidden lg:inline">{step.title}</span>
                      </h3>
                    </div>
                    <p className="mt-1 hidden text-sm leading-relaxed text-zinc-400 lg:block">
                      {step.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-600/20 to-blue-600/15 px-5 py-3 text-sm font-semibold text-violet-100 shadow-[0_0_24px_rgba(124,58,237,0.15)] transition-all duration-200 hover:border-violet-400/45 hover:from-violet-600/30 hover:to-blue-600/20 hover:shadow-[0_0_32px_rgba(124,58,237,0.22)] lg:mt-6 lg:inline-flex lg:w-auto lg:py-2.5"
          >
            Créer un lien tracké
            <ArrowRight size={16} className="text-violet-300" />
          </button>
        </div>

        <div className="relative min-w-0 w-full lg:flex lg:justify-end">
          <div
            className="pointer-events-none absolute -inset-3 rounded-3xl bg-violet-600/10 blur-3xl sm:-inset-4"
            aria-hidden
          />
          <div className="relative w-full min-w-0 origin-center lg:scale-[1.1] xl:scale-[1.12]">
            <CampaignDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
