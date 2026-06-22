import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const CHANNELS = new Set(["snapchat", "telegram", "tiktok", "instagram", "other"]);

type WaitlistBody = {
  name?: string;
  email?: string;
  shopName?: string;
  channel?: string;
  channelOther?: string;
};

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 500 });
  }

  let body: WaitlistBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const shopName = body.shopName?.trim() ?? "";
  const channel = body.channel?.trim().toLowerCase() ?? "";
  const channelOther = body.channelOther?.trim() ?? "";

  if (!name || !email || !shopName || !channel) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
