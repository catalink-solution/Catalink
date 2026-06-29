import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  WAITLIST_FIELD_LIMITS,
  WAITLIST_MIN_SUBMIT_MS,
  type WaitlistFieldKey,
} from "@/lib/waitlist-limits";

// TODO: Ajouter un rate limit IP/email avec Upstash ou Vercel KV avant ouverture publique large.

const CHANNELS = new Set(["snapchat", "telegram", "tiktok", "instagram", "other"]);

const NEUTRAL_SUCCESS = NextResponse.json({ ok: true });

type WaitlistBody = {
  name?: string;
  email?: string;
  shopName?: string;
  channel?: string;
  channelOther?: string;
  website?: string;
  startedAt?: number;
};

function firstFieldTooLong(fields: {
  name: string;
  email: string;
  shopName: string;
  channelOther: string;
}): WaitlistFieldKey | null {
  if (fields.name.length > WAITLIST_FIELD_LIMITS.name) return "name";
  if (fields.email.length > WAITLIST_FIELD_LIMITS.email) return "email";
  if (fields.shopName.length > WAITLIST_FIELD_LIMITS.shopName) return "shopName";
  if (fields.channelOther.length > WAITLIST_FIELD_LIMITS.channelOther) return "channelOther";
  return null;
}

function isBotSubmission(body: WaitlistBody): boolean {
  if (body.website?.trim()) return true;

  const startedAt = body.startedAt;
  if (typeof startedAt === "number" && Number.isFinite(startedAt)) {
    const elapsed = Date.now() - startedAt;
    if (elapsed >= 0 && elapsed < WAITLIST_MIN_SUBMIT_MS) return true;
  }

  return false;
}

export async function POST(request: Request) {
  let body: WaitlistBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (isBotSubmission(body)) {
    return NEUTRAL_SUCCESS;
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 500 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const shopName = body.shopName?.trim() ?? "";
  const channel = body.channel?.trim().toLowerCase() ?? "";
  const channelOther = body.channelOther?.trim() ?? "";

  if (!name || !email || !shopName || !channel) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const tooLongField = firstFieldTooLong({ name, email, shopName, channelOther });
  if (tooLongField) {
    return NextResponse.json({ error: "field_too_long", field: tooLongField }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  if (!CHANNELS.has(channel)) {
    return NextResponse.json({ error: "invalid_channel" }, { status: 400 });
  }

  if (channel === "other" && !channelOther) {
    return NextResponse.json({ error: "channel_other_required" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("waitlist_requests")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "duplicate_email" }, { status: 409 });
  }

  const { error } = await admin.from("waitlist_requests").insert({
    name,
    email,
    shop_name: shopName,
    channel,
    channel_other: channel === "other" ? channelOther : null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "duplicate_email" }, { status: 409 });
    }
    console.error("[waitlist] insert failed:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
