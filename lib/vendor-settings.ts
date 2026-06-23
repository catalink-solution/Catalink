/** Labels affichés pour le plan abonnement (`shops.plan`). */
export const SUBSCRIPTION_PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  business: "Business",
};

export function subscriptionPlanLabel(plan: string | null | undefined): string {
  if (!plan) return "Gratuit";
  return SUBSCRIPTION_PLAN_LABELS[plan] ?? plan;
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  trialing: "Essai",
  expired: "Expiré",
  cancelled: "Annulé",
};

export function subscriptionStatusLabel(status: string | null | undefined): string {
  if (!status) return "Actif";
  return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
}

/** Lien WhatsApp vendeur (base) — le message commande est ajouté au checkout. */
export function buildVendorWhatsAppPreview(whatsapp: string): string | null {
  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

/** Exemple de message client (aperçu, non fonctionnel). */
export const WHATSAPP_ORDER_PREVIEW_MESSAGE = `Bonjour,

Je souhaite finaliser la commande #A1B2C3D4

Produits :
• Produit exemple x1

Montant total :
29 €

Merci.`;
