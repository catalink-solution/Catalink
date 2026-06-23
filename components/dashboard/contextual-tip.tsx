"use client";

import { Lightbulb } from "lucide-react";
import { useVendorOnboarding } from "@/components/dashboard/use-vendor-onboarding";

const TIPS: Record<
  "shop" | "products" | "orders",
  { stepIds: Array<"shop" | "whatsapp" | "product" | "order">; message: string }
> = {
  shop: {
    stepIds: ["shop", "whatsapp"],
    message:
      "Configure le nom, le lien public et WhatsApp (dans Paramètres) — tes clients en auront besoin à chaque commande.",
  },
  products: {
    stepIds: ["product"],
    message:
      "Ajoute au moins un produit actif avec photo et prix pour ouvrir ton catalogue.",
  },
  orders: {
    stepIds: ["order"],
    message:
      "Les commandes apparaissent ici. Confirme le paiement WhatsApp puis mets à jour le statut.",
  },
};

export function ContextualTip({ page }: { page: keyof typeof TIPS }) {
  const { loading, complete, steps } = useVendorOnboarding();
  const tip = TIPS[page];

  if (loading || complete) return null;

  const show = tip.stepIds.some((id) => {
    const step = steps.find((s) => s.id === id);
    return step && !step.complete;
  });
  if (!show) return null;

  return (
    <div className="mb-6 flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
      <Lightbulb className="mt-0.5 shrink-0 text-amber-400/90" size={16} />
      <p>{tip.message}</p>
    </div>
  );
}
