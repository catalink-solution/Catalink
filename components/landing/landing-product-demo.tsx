import { ArrowDown, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { DashboardPreviewMock, PhoneStoreMock } from "@/components/landing/mockups";

const TITLE_GRADIENT =
  "bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent";

const FLOW_STEPS = [
  "Le client choisit ses produits",
  "Il valide sa commande",
  "Tu la retrouves dans ton dashboard",
] as const;

const CLIENT_CHIPS = [
  { label: "Boutique mobile", mobile: true },
  { label: "Produits visibles", mobile: false },
  { label: "Commande simple", mobile: false },
] as const;

const VENDOR_CHIPS = [
  { label: "Dashboard desktop", mobile: true },
  { label: "Commandes centralisées", mobile: false },
  { label: "Gestion produits", mobile: false },
  { label: "Suivi clients", mobile: false },
] as const;

function FeatureChip({
  children,
  variant = "violet",
  className = "",
}: {
  children: string;
  variant?: "violet" | "blue";
  className?: string;
}) {
  const styles =
    variant === "blue"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-100"
      : "border-violet-400/20 bg-violet-500/10 text-violet-100";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold sm:px-3 sm:py-1.5 ${styles} ${className}`}
    >
      {children}
    </span>
  );
}

function FlowConnector({ layout }: { layout: "horizontal" | "vertical" }) {
  const horizontal = layout === "horizontal";

  if (horizontal) {
    return (
      <div className="relative flex w-full items-center justify-center px-2" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="relative z-20 flex items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-950/90 px-5 py-2 shadow-[0_0_30px_rgba(124,58,237,0.35)] backdrop-blur-md">
          <span className="text-xs font-semibold text-violet-100">Commande synchronisée</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-violet-300/80" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto my-3 flex w-fit items-center gap-1 rounded-full border border-violet-300/30 bg-violet-950/90 px-4 py-2 shadow-[0_0_16px_rgba(124,58,237,0.2)] backdrop-blur-sm lg:my-3"
      aria-hidden
    >
      <span className="text-xs font-semibold text-violet-100">Commande synchronisée</span>
      <ArrowDown className="h-3.5 w-3.5 shrink-0 text-violet-300/80" strokeWidth={2.5} />
    </div>
  );
}

function FlowTimeline() {
  return (
    <ol className="relative mx-auto mt-7 hidden max-w-3xl lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-4">
      <div
        className="pointer-events-none absolute left-[10%] right-[10%] top-[1.625rem] hidden h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent lg:block"
        aria-hidden
      />
      {FLOW_STEPS.map((step, index) => (
        <li key={step} className="relative z-[1] flex flex-1 flex-col items-center gap-2.5 text-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-300/45 bg-gradient-to-br from-violet-500/35 to-blue-500/25 text-sm font-bold text-white shadow-[0_0_28px_rgba(124,58,237,0.28)] backdrop-blur-sm">
            {index + 1}
          </span>
          <p className="max-w-[10.5rem] text-[12px] font-medium leading-snug text-slate-200 sm:text-xs">
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}

const MOBILE_VENDOR_STATS = [
  { label: "Nouvelles", value: "64" },
  { label: "CA", value: "4 820 €" },
  { label: "Panier moy.", value: "72 €" },
] as const;

const MOBILE_VENDOR_ORDERS = [
  { product: "Maillot France", price: "45 €", status: "Nouveau", tone: "violet", mobile: true },
  { product: "Sneakers", price: "89 €", status: "Confirmé", tone: "emerald", mobile: true },
  { product: "Parfum", price: "59 €", status: "Livré", tone: "blue", mobile: false },
] as const;

const ORDER_STATUS_STYLES = {
  violet: "border-violet-400/25 bg-violet-500/15 text-violet-200",
  emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  blue: "border-blue-400/25 bg-blue-500/10 text-blue-200",
} as const;

function MobileVendorDashboard() {
  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-violet-500/20 shadow-[0_0_40px_rgba(79,70,229,0.15)] ring-1 ring-violet-500/20 lg:hidden"
      style={{ background: "#06080f" }}
    >
      <div
        className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5"
        style={{ background: "#04060c" }}
      >
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="font-mono text-xs text-slate-300">catalink.app/dashboard</span>
        <div className="w-8" />
      </div>

      <div className="p-3">
        <h3 className="text-base font-extrabold text-white">Commandes</h3>

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {MOBILE_VENDOR_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2"
            >
              <p className="text-[13px] font-medium text-slate-200">{stat.label}</p>
              <p className="mt-0.5 text-[13px] font-bold tabular-nums text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-2.5 text-[13px] font-bold uppercase tracking-wider text-slate-200">
          Dernières commandes
        </p>
        <div className="mt-1.5 space-y-1">
          {MOBILE_VENDOR_ORDERS.map((order) => (
            <div
              key={order.product}
              className={`flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 ${order.mobile ? "flex" : "hidden lg:flex"}`}
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-100">{order.product}</p>
                <p className="text-[13px] font-bold tabular-nums text-slate-200">{order.price}</p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_STYLES[order.tone]}`}
              >
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoPanel({
  label,
  labelClass,
  chips,
  chipVariant,
  glowClass,
  hideMobileChips = false,
  children,
}: {
  label: string;
  labelClass: string;
  chips: readonly { label: string; mobile: boolean }[];
  chipVariant?: "violet" | "blue";
  glowClass: string;
  hideMobileChips?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <p
        className={`mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] lg:mb-3 lg:text-left ${labelClass}`}
      >
        {label}
      </p>
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-visible rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-[0_0_60px_rgba(124,58,237,0.08)] transition-all duration-300 hover:border-violet-400/25 hover:shadow-[0_0_70px_rgba(124,58,237,0.12)] sm:p-5 lg:min-h-0 ${
          hideMobileChips ? "p-2 pb-1" : "p-2.5"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(99,102,241,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 100%)",
        }}
      >
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible py-0 sm:py-1">
          <div
            className={`pointer-events-none absolute inset-x-4 inset-y-0 rounded-3xl blur-3xl ${glowClass}`}
            aria-hidden
          />
          <div className="relative z-[1] flex w-full min-w-0 items-center justify-center overflow-visible">
            {children}
          </div>
        </div>
        <div
          className={`mt-2 flex-wrap justify-center gap-1.5 border-t border-white/[0.06] pt-2 sm:mt-3 sm:gap-2 sm:pt-3 lg:mt-4 lg:pt-4 lg:justify-start ${
            hideMobileChips ? "hidden lg:flex" : "flex"
          }`}
        >
          {chips.map((chip) => (
            <FeatureChip
              key={chip.label}
              variant={chipVariant}
              className={chip.mobile ? "" : "hidden sm:inline-flex"}
            >
              {chip.label}
            </FeatureChip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingProductDemo() {
  return (
    <section id="demo" className="relative py-12 sm:py-14 lg:pb-14 lg:pt-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="pt-1 sm:pt-2">
          <SectionHeading
            label="COMMENT ÇA MARCHE"
            title={
              <>
                Deux expériences, un seul{" "}
                <span className={TITLE_GRADIENT}>flux de vente</span>
              </>
            }
            align="center"
          />
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[13px] leading-6 text-slate-300 sm:mt-4 sm:text-[15px]">
          <span className="block">Le client commande depuis ta boutique mobile.</span>
          <span className="block">Toi, tu pilotes tout depuis ton dashboard Catalink.</span>
        </p>

        <FlowTimeline />

        <div className="mt-2 flex flex-col gap-1.5 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(8.5rem,10rem)_minmax(0,1fr)] lg:items-stretch lg:gap-x-6 lg:gap-y-5 xl:gap-x-8">
          <DemoPanel
            label="Côté client"
            labelClass="text-violet-300"
            chips={CLIENT_CHIPS}
            chipVariant="violet"
            glowClass="bg-emerald-500/10"
            hideMobileChips
          >
            <PhoneStoreMock
              size="default"
              showWhatsApp={false}
              storeName="Maboutique"
              storeSlug="maboutique"
              className="mx-auto w-full max-w-[min(100%,360px)] scale-[1.1] sm:max-w-[400px] sm:scale-[1.22]"
            />
          </DemoPanel>

          <div className="hidden lg:flex lg:items-center lg:justify-center lg:self-center lg:-translate-y-5 xl:-translate-y-6">
            <FlowConnector layout="horizontal" />
          </div>

          <div className="flex justify-center lg:hidden">
            <FlowConnector layout="vertical" />
          </div>

          <DemoPanel
            label="Côté vendeur"
            labelClass="text-blue-300"
            chips={VENDOR_CHIPS}
            chipVariant="blue"
            glowClass="bg-violet-600/15"
            hideMobileChips
          >
            <div className="w-full min-w-0 overflow-visible">
              <MobileVendorDashboard />
              <div className="hidden w-full lg:block">
                <DashboardPreviewMock className="mx-auto w-full max-w-full origin-center overflow-visible shadow-[0_0_50px_rgba(79,70,229,0.18)] ring-1 ring-violet-500/20 lg:scale-[1.03]" />
              </div>
            </div>
          </DemoPanel>
        </div>
      </div>
    </section>
  );
}
