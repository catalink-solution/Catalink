import type { Shop } from "@/lib/types";

export type OnboardingStepId = "shop" | "whatsapp" | "product" | "order" | "share";

export type OnboardingStep = {
  id: OnboardingStepId;
  label: string;
  description: string;
  href: string;
  complete: boolean;
};

export type OnboardingSnapshot = {
  shop: Pick<Shop, "id" | "name" | "slug" | "whatsapp"> | null;
  productCount: number;
  orderCount: number;
  sharedStorefront: boolean;
};

const STEP_DEFS: Array<{
  id: OnboardingStepId;
  label: string;
  description: string;
  href: string;
  isComplete: (s: OnboardingSnapshot) => boolean;
}> = [
  {
    id: "shop",
    label: "Créer sa boutique",
    description: "Nom et lien public de ta boutique.",
    href: "/dashboard/shop",
    isComplete: (s) => Boolean(s.shop?.name?.trim() && s.shop?.slug?.trim()),
  },
  {
    id: "whatsapp",
    label: "Configurer WhatsApp",
    description: "Numéro pour recevoir les commandes clients.",
    href: "/dashboard/settings",
    isComplete: (s) => Boolean(s.shop?.whatsapp?.replace(/\D/g, "")),
  },
  {
    id: "product",
    label: "Ajouter son premier produit",
    description: "Au moins un produit visible dans ton catalogue.",
    href: "/dashboard/products",
    isComplete: (s) => s.productCount >= 1,
  },
  {
    id: "order",
    label: "Tester une commande",
    description: "Reçois ta première commande (test ou réelle).",
    href: "/dashboard/orders",
    isComplete: (s) => s.orderCount >= 1,
  },
  {
    id: "share",
    label: "Partager sa boutique",
    description: "Ouvre ou copie le lien public de ta boutique.",
    href: "/dashboard/welcome",
    isComplete: (s) => s.sharedStorefront,
  },
];

export function buildOnboardingSteps(snapshot: OnboardingSnapshot): OnboardingStep[] {
  return STEP_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    description: def.description,
    href: def.href,
    complete: def.isComplete(snapshot),
  }));
}

export function onboardingProgress(steps: OnboardingStep[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.complete).length;
  return Math.round((done / steps.length) * 100);
}

export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return onboardingProgress(steps) === 100;
}

export function nextIncompleteStep(steps: OnboardingStep[]): OnboardingStep | null {
  return steps.find((s) => !s.complete) ?? null;
}
