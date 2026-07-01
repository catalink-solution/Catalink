import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let browserClient: SupabaseClient | undefined;

/** Client navigateur — à appeler uniquement côté client (handlers, effects). */
export function getSupabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(url, key, {
      auth: {
        // Parsing manuel sur /auth/callback et /auth/reset-password (évite les races).
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserClient;
}

/** Client serveur (RSC, routes API). */
export function getSupabaseServer(): SupabaseClient {
  return createClient(url, key);
}

/** @deprecated Préférer getSupabaseBrowser() ou getSupabaseServer() selon le contexte. */
export const supabase =
  typeof window !== "undefined" ? getSupabaseBrowser() : getSupabaseServer();

export function isSupabaseConfigured() {
  return Boolean(url && key);
}
