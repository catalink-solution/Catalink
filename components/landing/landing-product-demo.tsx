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

const CLIENT_CHIPS = ["Boutique mobile", "Produits visibles", "Commande simple"] as const;

const VENDOR_CHIPS = [
  "Dashboard desktop",
  "Commandes centralisées",
  "Gestion produits",
  "Suivi clients",
] as const;

function FeatureChip({ children, variant = "violet" }: { children: string; variant?: "violet" | "blue" }) {
  const styles =
    variant === "blue"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-100"
      : "border-violet-400/20 bg-violet-500/10 text-violet-100";

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${styles}`}
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
    <div className="relative flex flex-col items-center justify-center py-2" aria-hidden>
      <div className="absolute bottom-2 top-2 w-px bg-gradient-to-b from-transparent via-violet-400/40 to-transparent" />
      <div className="relative z-20 flex flex-col items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-950/90 px-5 py-2 shadow-[0_0_30px_rgba(124,58,237,0.35)] backdrop-blur-md">
        <span className="text-xs font-semibold text-violet-100">Commande synchronisée</span>
        <ArrowDown className="h-3.5 w-3.5 shrink-0 text-violet-300/80" strokeWidth={2.5} />
      </div>
    </div>
  );
}

function FlowTimeline() {
  return (
    <ol className="relative mx-auto mt-7 flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div
        className="pointer-events-none absolute left-[10%] right-[10%] top-[1.625rem] hidden h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent sm:block"
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

function DemoPanel({
  label,
  labelClass,
  chips,
  chipVariant,
  glowClass,
  children,
}: {
  label: string;
  labelClass: string;
  chips: readonly string[];
  chipVariant?: "violet" | "blue";
  glowClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <p
        className={`mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] lg:text-left ${labelClass}`}
      >
        {label}
      </p>
      <div
        className="flex min-h-0 flex-1 flex-col overflow-visible rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_0_60px_rgba(124,58,237,0.08)] transition-all duration-300 hover:border-violet-400/25 hover:shadow-[0_0_70px_rgba(124,58,237,0.12)] sm:p-5 lg:min-h-0"
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(99,102,241,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 100%)",
        }}
      >
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible py-1">
          <div
            className={`pointer-events-none absolute inset-x-4 inset-y-0 rounded-3xl blur-3xl ${glowClass}`}
            aria-hidden
          />
          <div className="relative z-[1] flex w-full min-w-0 items-center justify-center overflow-visible">
            {children}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-white/[0.06] pt-4 lg:justify-start">
          {chips.map((chip) => (
            <FeatureChip key={chip} variant={chipVariant}>
              {chip}
            </FeatureChip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingProductDemo() {
  return (
    <section id="demo" className="relative pb-12 pt-20 sm:pb-14 sm:pt-24">
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
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-slate-300 sm:text-[15px]">
          <span className="block">Le client commande depuis ta boutique mobile.</span>
          <span className="block">Toi, tu pilotes tout depuis ton dashboard Catalink.</span>
        </p>

        <FlowTimeline />

        <div className="mt-8 flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(8.5rem,10rem)_minmax(0,1fr)] lg:items-stretch lg:gap-x-6 xl:gap-x-8">
          <DemoPanel
            label="Côté client"
            labelClass="text-violet-300"
            chips={CLIENT_CHIPS}
            chipVariant="violet"
            glowClass="bg-emerald-500/10"
          >
            <PhoneStoreMock
              size="default"
              showWhatsApp={false}
              storeName="Maboutique"
              storeSlug="maboutique"
              className="mx-auto w-full max-w-[min(100%,380px)] scale-[1.18] sm:max-w-[400px] sm:scale-[1.22]"
            />
          </DemoPanel>

          <div className="hidden lg:flex lg:items-center lg:justify-center lg:self-center lg:-translate-y-5 xl:-translate-y-6">
            <FlowConnector layout="horizontal" />
          </div>

          <div className="lg:hidden">
            <FlowConnector layout="vertical" />
          </div>

          <DemoPanel
            label="Côté vendeur"
            labelClass="text-blue-300"
            chips={VENDOR_CHIPS}
            chipVariant="blue"
            glowClass="bg-violet-600/15"
          >
            <div className="w-full min-w-0 overflow-visible px-0.5">
              <DashboardPreviewMock className="mx-auto w-full max-w-full origin-center scale-[0.98] overflow-visible shadow-[0_0_50px_rgba(79,70,229,0.18)] ring-1 ring-violet-500/20 sm:scale-100 lg:scale-[1.03]" />
            </div>
          </DemoPanel>
        </div>
      </div>
    </section>
  );
}
