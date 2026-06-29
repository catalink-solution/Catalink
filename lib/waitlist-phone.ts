import { WAITLIST_FIELD_LIMITS } from "@/lib/waitlist-limits";

const PHONE_INPUT_PATTERN = /^[\d+\s\-()]+$/;

/** Normalize phone: keep leading + if present, digits only otherwise. */
export function normalizeWaitlistPhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

export function isValidWaitlistPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > WAITLIST_FIELD_LIMITS.phone) return false;
  if (!PHONE_INPUT_PATTERN.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 8;
}

/** wa.me expects digits only (no +). */
export function whatsAppUrl(phoneNormalized: string | null | undefined): string | null {
  if (!phoneNormalized) return null;
  const digits = phoneNormalized.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}
