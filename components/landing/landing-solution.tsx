import { CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { SolutionFlowStrip } from "@/components/landing/mockups";

export function LandingSolution() {
  return (
    <section
      id="solution"
      className="border-y border-[var(--surface-border)] py-12 sm:py-14 lg:py-24"
      style={{ background: "rgba(255,255,255,0.012)" }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid items-start gap-6 sm:gap-10 lg:grid-cols-[1fr_280px] lg:gap-14">
          <div>
            <SectionHeading
              label="La solution"
              title={
                <>
                  Catalink transforme tes DM en{" "}
                  <span className="gradient-text">système de vente structuré</span>
                </>
              }
              description="Catalink ne remplace pas WhatsApp — il organise ton flux de vente : catalogue public, panier, redirection WhatsApp, puis suivi dans ton dashboard."
            />
            <SolutionFlowStrip />
          </div>

          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              background: "rgba(59,130,246,0.05)",
              borderColor: "rgba(99,102,241,0.25)",
            }}
          >
            <div className="mb-3 flex items-center gap-3 sm:mb-4">
              <CheckCircle2 size={28} className="text-green-400" />
              <p className="text-base font-bold text-green-300 lg:text-green-400">Avec Catalink</p>
            </div>
            <ul className="space-y-3 text-[13px] leading-6 text-slate-300 sm:space-y-3 sm:text-sm lg:text-[var(--muted)]">
              {[
                "Un lien unique dans ta bio ou tes stories",
                "Un catalogue clair avec prix et produits",
                "Commandes centralisées dans ton dashboard",
                "Paiement finalisé sur WhatsApp, comme aujourd'hui",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
