import type { SupabaseClient } from "@supabase/supabase-js";

export function parseAuthHash(hash: string): URLSearchParams {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

export type AuthUrlSessionResult = "recovery" | "session" | "none" | "error";

/** Établit une session Supabase depuis hash, code PKCE ou token_hash recovery. */
export async function establishSessionFromUrl(
  supabase: SupabaseClient
): Promise<AuthUrlSessionResult> {
  const url = new URL(window.location.href);

  const tokenHash = url.searchParams.get("token_hash");
  const queryType = url.searchParams.get("type");
  if (tokenHash && queryType === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    if (error) return "error";
    window.history.replaceState({}, "", url.pathname);
    return "recovery";
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return "error";
    window.history.replaceState({}, "", url.pathname);
    return "recovery";
  }

  const hashParams = parseAuthHash(window.location.hash);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const hashType = hashParams.get("type");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return "error";
    window.history.replaceState({}, "", url.pathname);
    return hashType === "recovery" ? "recovery" : "session";
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!userError && user) return "session";

  return "none";
}

export function mapPasswordUpdateError(message: string, code?: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("same") || code === "same_password") {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (lower.includes("session") || code === "session_not_found") {
    return "Ta session a expiré. Demande un nouveau lien.";
  }
  return "Impossible de mettre à jour le mot de passe. Réessaie ou demande un nouveau lien.";
}
