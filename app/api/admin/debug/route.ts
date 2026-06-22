import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAdminEmail, isAdminEmail } from "@/lib/admin/auth";

/** Diagnostic temporaire — ne renvoie jamais la valeur de ADMIN_EMAIL. */
export async function GET(request: Request) {
  const adminEmailConfigured = Boolean(getAdminEmail());

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  let tokenEmail: string | null = null;
  if (token) {
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const {
      data: { user },
    } = await authClient.auth.getUser();
    tokenEmail = user?.email ?? null;
  }

  const isAdmin = isAdminEmail(tokenEmail);

  let apiStatus: number;
  let apiError: string | null = null;

  if (!adminEmailConfigured) {
    apiStatus = 503;
    apiError = "admin_not_configured";
  } else if (!token) {
    apiStatus = 401;
    apiError = "unauthorized";
  } else if (!tokenEmail) {
    apiStatus = 401;
    apiError = "unauthorized";
  } else if (!isAdmin) {
    apiStatus = 403;
    apiError = "forbidden";
  } else {
    apiStatus = 200;
  }

  return NextResponse.json({
    tokenEmail,
    adminEmailConfigured,
    isAdmin,
    apiStatus,
    apiError,
  });
}
