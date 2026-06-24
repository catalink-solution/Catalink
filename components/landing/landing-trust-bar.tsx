import {
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const TRUST_ITEMS = [
  { icon: Sparkles, label: "Bêta privée" },
  { icon: KeyRound, label: "Accès sur invitation" },
  { icon: Users, label: "Pensé pour les vendeurs social commerce" },
  { icon: MessageCircle, label: "Commandes via WhatsApp" },
  { icon: ShieldCheck, label: "Sans paiement intégré obligatoire" },
];

export function LandingTrustBar() {
  return (
    <div className="border-y border-[var(--surface-border)] py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-zinc-300 sm:text-sm"
              >
                <Icon size={15} className="shrink-0 text-violet-300" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
