/** Client-side flag : le vendeur a ouvert ou copié le lien de sa boutique (étape 5). */
const SHARED_KEY = "catalink_onboarding_shared";

export function markStorefrontShared(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHARED_KEY, "1");
}

export function hasMarkedStorefrontShared(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SHARED_KEY) === "1";
}
