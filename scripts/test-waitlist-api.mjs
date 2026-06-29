/** Manual API checks for waitlist P0 — run with: node scripts/test-waitlist-api.mjs */
const BASE = process.env.WAITLIST_TEST_URL ?? "http://localhost:3025";

const valid = {
  name: "Test User",
  email: `test-${Date.now()}@example.com`,
  shopName: "Ma Boutique",
  channel: "tiktok",
  startedAt: Date.now() - 5000,
};

async function post(label, body) {
  const res = await fetch(`${BASE}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  console.log(`${label}: ${res.status}`, JSON.stringify(json));
  return { res, json };
}

async function main() {
  await post("valid", valid);
  await post("invalid_email", { ...valid, email: "bad" });
  await post("duplicate", { ...valid, email: valid.email });
  await post("channel_other_missing", {
    ...valid,
    email: `other-${Date.now()}@example.com`,
    channel: "other",
  });
  await post("field_too_long", {
    ...valid,
    email: `long-${Date.now()}@example.com`,
    name: "x".repeat(81),
  });
  await post("honeypot", { ...valid, email: `bot-${Date.now()}@example.com`, website: "spam" });
  await post("too_fast", {
    ...valid,
    email: `fast-${Date.now()}@example.com`,
    startedAt: Date.now(),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
