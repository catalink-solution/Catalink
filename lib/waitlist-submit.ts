import type { SupabaseClient } from "@supabase/supabase-js";

export type WaitlistRequestRow = {
  id: string;
  email: string;
  status: string;
};

const ACTIVE_WAITLIST_STATUSES = new Set(["pending", "invited", "registered"]);

export function isActiveWaitlistStatus(status: string): boolean {
  return ACTIVE_WAITLIST_STATUSES.has(status);
}

export function canReactivateWaitlistStatus(status: string): boolean {
  return status === "declined" || status === "registered";
}

export async function fetchWaitlistByEmail(
  admin: SupabaseClient,
  email: string
): Promise<WaitlistRequestRow | null> {
  const { data, error } = await admin
    .from("waitlist_requests")
    .select("id, email, status")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw error;
  return (data as WaitlistRequestRow | null) ?? null;
}

export async function fetchWaitlistByPhone(
  admin: SupabaseClient,
  phoneNormalized: string
): Promise<WaitlistRequestRow | null> {
  const { data, error } = await admin
    .from("waitlist_requests")
    .select("id, email, status")
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();
  if (error) throw error;
  return (data as WaitlistRequestRow | null) ?? null;
}

export type WaitlistReactivatePayload = {
  name: string;
  email: string;
  phone: string;
  phone_normalized: string;
  shop_name: string;
  channel: string;
  channel_other: string | null;
};

export async function clearDeclinedPhoneHolder(
  admin: SupabaseClient,
  rowId: string
): Promise<void> {
  const { error } = await admin
    .from("waitlist_requests")
    .update({ phone: null, phone_normalized: null })
    .eq("id", rowId);
  if (error) throw error;
}

export async function reactivateWaitlistRow(
  admin: SupabaseClient,
  rowId: string,
  payload: WaitlistReactivatePayload
): Promise<void> {
  const { error } = await admin
    .from("waitlist_requests")
    .update({
      ...payload,
      status: "pending",
      declined_at: null,
      declined_by: null,
      invited_at: null,
      invited_by: null,
    })
    .eq("id", rowId);
  if (error) throw error;
}
