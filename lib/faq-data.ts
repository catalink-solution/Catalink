export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Catalink remplace-t-il WhatsApp ?",
    answer:
      "Non. WhatsApp reste ton canal de communication et de paiement avec tes clients. Catalink structure le catalogue, le panier et les commandes — puis redirige vers WhatsApp pour finaliser.",
  },
  {
    question: "Est-ce qu'il y a un paiement intégré ?",
    answer:
      "Pas pour l'instant. Catalink ne remplace pas Stripe ou PayPal : le client commande sur ta boutique, puis tu finalises le paiement sur WhatsApp comme tu le fais déjà.",
  },
  {
    question: "Comment le client valide sa commande ?",
    answer:
      "Il parcourt ta boutique, ajoute au panier et clique sur Commander. Il est redirigé vers WhatsApp avec le récapitulatif. Tu confirmes le paiement et mets à jour le statut dans ton dashboard.",
  },
  {
    question: "Est-ce adapté à Snapchat / Telegram / TikTok ?",
    answer:
      "Oui. Catalink est pensé pour le social commerce : tu partages ton lien Catalink dans ta bio, tes stories ou tes posts. Tes abonnés arrivent directement sur ton catalogue.",
  },
  {
    question: "Puis-je tester gratuitement ?",
    answer:
      "L'accès se fait via la bêta privée. Inscris-toi sur la liste d'attente — on te recontacte pour valider ton accès et t'accompagner au lancement.",
  },
  {
    question: "Comment accéder à la bêta ?",
    answer:
      "Clique sur « Demander un accès », remplis le formulaire waitlist. Notre équipe valide les candidatures et t'envoie les instructions de connexion.",
  },
  {
    question: "Est-ce que je peux utiliser mon propre lien ?",
    answer:
      "Oui. Chaque boutique a un lien personnalisé du type catalink.app/tonnom que tu peux partager où tu veux : bio Instagram, story Snapchat, canal Telegram…",
  },
  {
    question: "Est-ce que mes clients doivent créer un compte ?",
    answer:
      "Non. Tes clients parcourent ta boutique sans inscription. Ils commandent et passent par WhatsApp — aucune friction côté acheteur.",
  },
];
