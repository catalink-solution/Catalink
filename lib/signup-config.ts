/** Inscriptions publiques via /register. Défaut : fermées (false). */
export const PUBLIC_SIGNUP_DEFAULT = false;

export function isPublicSignupAllowed(): boolean {
  const raw = process.env.ALLOW_PUBLIC_SIGNUP?.trim().toLowerCase();
  if (!raw) return PUBLIC_SIGNUP_DEFAULT;
  return raw === "true";
}
