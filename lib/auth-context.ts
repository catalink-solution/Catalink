import { createClient } from "@supabase/supabase-js";
import { isPlatformAdminEmail } from "@/lib/admin/protection";

export type AuthContext = {
  isPlatformAdmin: boolean;
  hasShop: boolean;
};

/** Contexte session côté serveur — ne expose jamais ADMIN_EMAIL. */
export async function resolveAuthContext(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  );

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user?.email) return null;

  const { data: shop } = await authClient
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    isPlatformAdmin: isPlatformAdminEmail(user.email),
    hasShop: Boolean(shop),
  };
}
