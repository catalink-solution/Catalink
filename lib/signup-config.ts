/** Inscriptions publiques via /register. Défaut : fermées (false). */
export const PUBLIC_SIGNUP_DEFAULT = false;

/**
 * Pour bloquer toute création de compte hors invitation admin, désactiver aussi
 * « Enable email signup » dans Supabase Dashboard → Authentication → Providers.
 * Les invitations admin (`inviteUserByEmail`) restent actives via service role.
 */

export function isPublicSignupAllowed(): boolean {
  const raw = process.env.ALLOW_PUBLIC_SIGNUP?.trim().toLowerCase();
  if (!raw) return PUBLIC_SIGNUP_DEFAULT;
  return raw === "true";
}
