/** Client-side session + campaign ref helpers for a storefront slug. */

export function getSessionId(slug: string): string {
  if (typeof window === "undefined") return "";
  const key = `catalink_session_${slug}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function getCampaignRef(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`catalink_ref_${slug}`);
}

export function setCampaignRef(slug: string, ref: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`catalink_ref_${slug}`, ref);
}

export function getPromoCode(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`catalink_promo_${slug}`);
}

export function setPromoCode(slug: string, code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`catalink_promo_${slug}`, code);
}

function visitKey(slug: string, ref: string) {
  return `catalink_visit_${slug}_${ref.toLowerCase()}`;
}

export function hasRecordedVisit(slug: string, ref: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(visitKey(slug, ref)) === "1";
}

export function markVisitRecorded(slug: string, ref: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(visitKey(slug, ref), "1");
}
