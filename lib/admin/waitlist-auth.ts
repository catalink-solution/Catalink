import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthUserLite = {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

export async function listAllAuthUsersLite(admin: SupabaseClient): Promise<AuthUserLite[]> {
  const users: AuthUserLite[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email) {
        users.push({
          id: u.id,
          email: u.email.trim().toLowerCase(),
          last_sign_in_at: u.last_sign_in_at ?? null,
          email_confirmed_at: u.email_confirmed_at ?? null,
        });
      }
    }
    if (data.users.length < 100) break;
    page++;
  }
  return users;
}

export function authUserByEmail(users: AuthUserLite[]): Map<string, AuthUserLite> {
  return new Map(users.map((u) => [u.email, u]));
}

/** Inscrit = au moins une connexion réelle (pas seulement invitation Auth créée). */
export function isWaitlistProspectRegistered(user: AuthUserLite | undefined): boolean {
  return Boolean(user?.last_sign_in_at);
}

export function getInviteRedirectUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${appUrl}/auth/callback`;
}
