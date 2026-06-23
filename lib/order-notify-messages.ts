/** User-facing seller message for failed customer notification API responses. */
export function sellerNotifyHttpError(status: number, errorCode?: string): string {
  switch (status) {
    case 400:
      return "Notification client non envoyée : requête invalide.";
    case 401:
      return "Notification client non envoyée : reconnecte-toi au dashboard.";
    case 403:
      return "Notification client non envoyée : accès refusé.";
    case 404:
      return "Notification client non envoyée : commande introuvable.";
    case 500:
      return "Notification client non envoyée : erreur serveur.";
    default:
      return errorCode
        ? `Notification client non envoyée (${errorCode}).`
        : "Notification client non envoyée.";
  }
}
