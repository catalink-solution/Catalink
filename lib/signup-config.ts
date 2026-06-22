/** Inscriptions publiques via /register. Défaut : fermées (false). */
export function isPublicSignupAllowed(): boolean {
  return process.env.ALLOW_PUBLIC_SIGNUP?.trim().toLowerCase() === "true";
}
