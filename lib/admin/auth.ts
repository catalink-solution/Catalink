import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/** Email administrateur principal (env ADMIN_EMAIL). */
export function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = getAdminEmail();
  if (!admin || !email) return false;
  return email.trim().toLowerCase() === admin;
}

/** Vérifie Bearer token + email admin. Retourne l'utilisateur ou une NextResponse 401/403. */
export async function requireAdmin(request: Request) {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  );

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return { user, adminEmail };
}
