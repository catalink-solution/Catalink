import type { SupabaseClient } from "@supabase/supabase-js";

export function getResetPasswordRedirectUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${base}/auth/reset-password`;
}

export function parseAuthHash(hash: string): URLSearchParams {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

export type AuthUrlDebugInfo = {
  href_masked: string;
  pathname: string;
  search_keys: string[];
  hash_keys: string[];
  has_code: boolean;
  has_token_hash: boolean;
  has_token: boolean;
  has_access_token: boolean;
  has_refresh_token: boolean;
  type: string | null;
  error: string | null;
  error_description: string | null;
};

function maskUrlForLog(href: string): string {
  try {
    const u = new URL(href);
    if (u.hash) u.hash = "#[redacted]";
    for (const key of ["code", "token", "token_hash", "access_token", "refresh_token"]) {
      if (u.searchParams.has(key)) u.searchParams.set(key, "[redacted]");
    }
    return u.toString();
  } catch {
    return "[invalid-url]";
  }
}

/** Inspecte l’URL sans exposer les tokens (dev console + logs metadata). */
export function inspectAuthUrl(): AuthUrlDebugInfo {
  if (typeof window === "undefined") {
    return {
      href_masked: "",
      pathname: "",
      search_keys: [],
      hash_keys: [],
      has_code: false,
      has_token_hash: false,
      has_token: false,
      has_access_token: false,
      has_refresh_token: false,
      type: null,
      error: null,
      error_description: null,
    };
  }

  const url = new URL(window.location.href);
  const hashParams = parseAuthHash(window.location.hash);

  return {
    href_masked: maskUrlForLog(window.location.href),
    pathname: url.pathname,
    search_keys: [...url.searchParams.keys()],
    hash_keys: [...hashParams.keys()],
    has_code: url.searchParams.has("code"),
    has_token_hash: url.searchParams.has("token_hash") || hashParams.has("token_hash"),
    has_token: url.searchParams.has("token") || hashParams.has("token"),
    has_access_token: hashParams.has("access_token"),
    has_refresh_token: hashParams.has("refresh_token"),
    type: url.searchParams.get("type") ?? hashParams.get("type"),
    error: url.searchParams.get("error") ?? hashParams.get("error"),
    error_description:
      url.searchParams.get("error_description") ?? hashParams.get("error_description"),
  };
}

function maskQueryOrHash(raw: string): string {
  if (!raw) return raw;
  try {
    const params = new URLSearchParams(raw.startsWith("#") || raw.startsWith("?") ? raw.slice(1) : raw);
    for (const key of ["code", "token", "token_hash", "access_token", "refresh_token"]) {
      if (params.has(key)) params.set(key, "[redacted]");
    }
    const prefix = raw.startsWith("#") ? "#" : raw.startsWith("?") ? "?" : "";
    return `${prefix}${params.toString()}`;
  } catch {
    return "[redacted]";
  }
}

/** Log dev uniquement — format URL sans tokens. */
export function logAuthUrlDebug(debug: AuthUrlDebugInfo): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[auth/reset-password] URL inspect", {
    href: debug.href_masked,
    search: typeof window !== "undefined" ? maskQueryOrHash(window.location.search) : "",
    hash: typeof window !== "undefined" ? maskQueryOrHash(window.location.hash) : "",
    search_keys: debug.search_keys,
    hash_keys: debug.hash_keys,
    has_code: debug.has_code,
    has_token_hash: debug.has_token_hash,
    has_token: debug.has_token,
    has_access_token: debug.has_access_token,
    has_refresh_token: debug.has_refresh_token,
    type: debug.type,
    error: debug.error,
    error_description: debug.error_description,
  });
}

export type EstablishSessionResult = {
  status: "recovery" | "session" | "none" | "error";
  method?: string;
  errorMessage?: string;
  errorCode?: string;
  debug: AuthUrlDebugInfo;
  attempts: string[];
  hadRecoveryParams: boolean;
};

function cleanAuthUrl(pathname: string): void {
  window.history.replaceState({}, "", pathname);
}

async function confirmValidUser(
  supabase: SupabaseClient
): Promise<{ ok: boolean; errorMessage?: string; errorCode?: string }> {
  await new Promise((r) => setTimeout(r, 100));

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { ok: false, errorMessage: error.message, errorCode: error.code };
  }
  return { ok: Boolean(user) };
}

/** Attend PASSWORD_RECOVERY / SIGNED_IN après parsing URL. */
export function waitForRecoverySession(
  supabase: SupabaseClient,
  timeoutMs = 4000,
  options?: { hadRecoveryParams?: boolean }
): Promise<boolean> {
  const hadRecoveryParams = options?.hadRecoveryParams ?? false;

  return new Promise((resolve) => {
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      clearTimeout(timer);
      resolve(ok);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) return;
        if (event === "PASSWORD_RECOVERY") {
          void supabase.auth.getUser().then(({ data: { user } }) => finish(Boolean(user)));
          return;
        }
        if (event === "SIGNED_IN" && hadRecoveryParams) {
          void supabase.auth.getUser().then(({ data: { user } }) => finish(Boolean(user)));
        }
      }
    );

    if (!hadRecoveryParams) {
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) finish(true);
      });
    }

    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}

/**
 * Tente toutes les méthodes Supabase recovery (hash, PKCE, token_hash, token).
 * Ne dépend pas de detectSessionInUrl — parsing manuel exclusif.
 */
export async function establishSessionFromUrl(
  supabase: SupabaseClient
): Promise<EstablishSessionResult> {
  const debug = inspectAuthUrl();
  const attempts: string[] = [];
  let lastError: { message: string; code?: string } | undefined;

  if (typeof window === "undefined") {
    return { status: "none", debug, attempts, hadRecoveryParams: false };
  }

  const url = new URL(window.location.href);
  const hashParams = parseAuthHash(window.location.hash);

  const authError = debug.error;
  if (authError) {
    return {
      status: "error",
      errorMessage: debug.error_description ?? authError,
      debug,
      attempts: ["auth_error_in_url"],
      hadRecoveryParams: true,
    };
  }

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const hashType = hashParams.get("type");
  const code = url.searchParams.get("code");
  const tokenHash =
    url.searchParams.get("token_hash") ?? hashParams.get("token_hash");
  const queryType = url.searchParams.get("type") ?? hashType;

  const hadRecoveryParams = Boolean(
    (accessToken && refreshToken) ||
      code ||
      (tokenHash && (queryType === "recovery" || queryType === null))
  );

  if (accessToken && refreshToken) {
    attempts.push("hash_setSession");
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      cleanAuthUrl(url.pathname);
      const confirmed = await confirmValidUser(supabase);
      if (confirmed.ok) {
        return {
          status: hashType === "recovery" ? "recovery" : "session",
          method: "hash_setSession",
          debug,
          attempts,
          hadRecoveryParams,
        };
      }
      lastError = { message: confirmed.errorMessage ?? "getUser_failed", code: confirmed.errorCode };
    } else {
      lastError = { message: error.message, code: error.code };
    }
  }

  if (code) {
    attempts.push("pkce_exchangeCodeForSession");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      cleanAuthUrl(url.pathname);
      const confirmed = await confirmValidUser(supabase);
      if (confirmed.ok) {
        return { status: "recovery", method: "pkce_exchangeCodeForSession", debug, attempts, hadRecoveryParams };
      }
      lastError = { message: confirmed.errorMessage ?? "getUser_failed", code: confirmed.errorCode };
    } else {
      lastError = { message: error.message, code: error.code };
    }
  }

  if (tokenHash && (queryType === "recovery" || queryType === null)) {
    attempts.push("verifyOtp_token_hash");
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    if (!error) {
      cleanAuthUrl(url.pathname);
      const confirmed = await confirmValidUser(supabase);
      if (confirmed.ok) {
        return { status: "recovery", method: "verifyOtp_token_hash", debug, attempts, hadRecoveryParams };
      }
      lastError = { message: confirmed.errorMessage ?? "getUser_failed", code: confirmed.errorCode };
    } else {
      lastError = { message: error.message, code: error.code };
    }
  }

  if (!hadRecoveryParams) {
    attempts.push("existing_session");
    const confirmed = await confirmValidUser(supabase);
    if (confirmed.ok) {
      return { status: "session", method: "existing_session", debug, attempts, hadRecoveryParams };
    }
  }

  if (attempts.length > 0 || lastError) {
    return {
      status: "none",
      errorMessage: lastError?.message,
      errorCode: lastError?.code,
      debug,
      attempts,
      hadRecoveryParams,
    };
  }

  return { status: "none", debug, attempts, hadRecoveryParams };
}

export function mapPasswordUpdateError(message: string, code?: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("same") || code === "same_password") {
    return "Choisis un mot de passe différent de l'ancien.";
  }
  if (lower.includes("session") || code === "session_not_found") {
    return "Ta session a expiré. Demande un nouveau lien.";
  }
  return "Impossible de mettre à jour le mot de passe. Réessaie ou demande un nouveau lien.";
}
