import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAppError, PUBLIC_APP_ERROR_ACTIONS } from "@/lib/app-error-log";

const NEUTRAL_OK = NextResponse.json({ ok: true });

type LogBody = {
  action?: string;
  message?: string;
  route?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  let body: LogBody;
  try {
    body = await request.json();
  } catch {
    return NEUTRAL_OK;
  }

  const action = body.action?.trim().slice(0, 100) ?? "";
  const message = body.message?.trim() ?? "";
  if (!action || !message) return NEUTRAL_OK;

  let userId: string | null = null;
  let email: string | null = null;

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (user) {
      userId = user.id;
      email = user.email ?? null;
    }
  }

  if (!userId && !PUBLIC_APP_ERROR_ACTIONS.has(action)) {
    return NEUTRAL_OK;
  }

  await logAppError({
    userId,
    email,
    route: body.route?.trim().slice(0, 500) ?? "",
    action,
    message,
    metadata: body.metadata ?? {},
  });

  return NEUTRAL_OK;
}
