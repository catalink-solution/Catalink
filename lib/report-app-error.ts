import { supabase } from "@/lib/supabase";

type ReportAppErrorInput = {
  action: string;
  message: string;
  route?: string;
  metadata?: Record<string, unknown>;
};

/** Envoie une erreur au serveur sans impacter l'UX (réponse toujours silencieuse). */
export async function reportAppError(input: ReportAppErrorInput): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    await fetch("/api/log/error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: input.action,
        message: input.message,
        route: input.route ?? (typeof window !== "undefined" ? window.location.pathname : ""),
        metadata: input.metadata,
      }),
    });
  } catch {
    // Ne jamais remonter au testeur.
  }
}
