/** Réponses rapides — catégories et variables dynamiques. */

export const QUICK_REPLY_CATEGORIES = [
  { key: "availability", label: "Disponibilité taille" },
  { key: "price", label: "Prix" },
  { key: "delivery", label: "Livraison" },
  { key: "out_of_stock", label: "Rupture" },
  { key: "payment_reminder", label: "Relance paiement" },
  { key: "cart_reminder", label: "Relance panier" },
  { key: "support", label: "SAV" },
] as const;

export type QuickReplyCategory = (typeof QUICK_REPLY_CATEGORIES)[number]["key"];

export const QUICK_REPLY_VARIABLES = [
  { key: "product_name", label: "Nom produit", token: "{{product_name}}" },
  { key: "price", label: "Prix", token: "{{price}}" },
  { key: "size", label: "Taille", token: "{{size}}" },
  { key: "tracking_number", label: "N° suivi", token: "{{tracking_number}}" },
  { key: "customer_name", label: "Nom client", token: "{{customer_name}}" },
] as const;

export type QuickReplyVars = Partial<{
  product_name: string;
  price: string;
  size: string;
  tracking_number: string;
  customer_name: string;
}>;

export type QuickReply = {
  id: string;
  shop_id: string;
  title: string;
  category: string;
  content: string;
  created_at: string | null;
};

export function categoryLabel(key: string): string {
  return QUICK_REPLY_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function interpolateReply(content: string, vars: QuickReplyVars): string {
  let out = content;
  for (const v of QUICK_REPLY_VARIABLES) {
    const val = vars[v.key as keyof QuickReplyVars] ?? `[${v.label}]`;
    out = out.split(v.token).join(val);
  }
  return out;
}

export const DEFAULT_QUICK_REPLIES: Array<{
  title: string;
  category: QuickReplyCategory;
  content: string;
}> = [
  {
    title: "Taille disponible",
    category: "availability",
    content:
      "Salut {{customer_name}} 👋 Oui la taille {{size}} est dispo sur {{product_name}} ! Tu veux que je te la réserve ?",
  },
  {
    title: "Prix produit",
    category: "price",
    content: "{{product_name}} est à {{price}} 🔥 Dispo en {{size}}. Je t'envoie le lien ?",
  },
  {
    title: "Suivi livraison",
    category: "delivery",
    content:
      "Hey {{customer_name}}, ta commande est en route 📦 Numéro de suivi : {{tracking_number}}",
  },
  {
    title: "Rupture taille",
    category: "out_of_stock",
    content:
      "Désolé {{customer_name}}, la {{size}} de {{product_name}} est en rupture pour le moment. Je te préviens dès le restock ?",
  },
  {
    title: "Relance paiement",
    category: "payment_reminder",
    content:
      "Salut {{customer_name}} 👋 Petit rappel pour finaliser ta commande {{product_name}} ({{price}}). Tu es toujours partant(e) ?",
  },
  {
    title: "Relance panier",
    category: "cart_reminder",
    content:
      "Hey {{customer_name}} ! Tu avais laissé {{product_name}} dans ton panier 🛒 Il reste peu de stock en {{size}}, tu veux que je te le garde ?",
  },
  {
    title: "SAV général",
    category: "support",
    content:
      "Salut {{customer_name}}, merci de me contacter 🙏 Dis-moi comment je peux t'aider avec ta commande.",
  },
];
