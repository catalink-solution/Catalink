/**
 * Sprint 4A — vendor settings regression checks.
 * Usage: npx tsx scripts/test-vendor-settings-sprint.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildVendorWhatsAppPreview,
  subscriptionPlanLabel,
} from "../lib/vendor-settings";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let passed = 0;
let failed = 0;

function ok(label: string) {
  passed++;
  console.log(`✓ ${label}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

const settingsPage = path.join(root, "app/dashboard/settings/page.tsx");
const nav = path.join(root, "components/dashboard/dashboard-nav.tsx");
const migration = path.join(root, "supabase/migrations/20260624120000_vendor_settings.sql");

if (fs.existsSync(settingsPage)) ok("settings page exists at /dashboard/settings");
else fail("settings page exists at /dashboard/settings");

const navContent = fs.readFileSync(nav, "utf8");
if (navContent.includes('href: "/dashboard/settings"') && navContent.includes("Paramètres")) {
  ok("dashboard nav includes Paramètres link");
} else {
  fail("dashboard nav includes Paramètres link");
}

const page = fs.readFileSync(settingsPage, "utf8");
if (page.includes("async function saveProfile") && page.includes("owner_first_name")) {
  ok("settings page saves profile fields");
} else {
  fail("settings page saves profile fields");
}

if (page.includes("async function saveNotifications") && page.includes("notify_order_email")) {
  ok("settings page saves notification preferences");
} else {
  fail("settings page saves notification preferences");
}

if (page.includes("async function saveWhatsapp") && page.includes("buildVendorWhatsAppPreview")) {
  ok("settings page saves WhatsApp with link preview");
} else {
  fail("settings page saves WhatsApp with link preview");
}

const mig = fs.readFileSync(migration, "utf8");
if (
  mig.includes("notify_order_email") &&
  mig.includes("owner_first_name") &&
  mig.includes("notify_catalink_marketing")
) {
  ok("vendor settings migration defines required columns");
} else {
  fail("vendor settings migration defines required columns");
}

if (subscriptionPlanLabel("free") === "Gratuit") ok("subscriptionPlanLabel helper");
else fail("subscriptionPlanLabel helper");

const wa = buildVendorWhatsAppPreview("+33 612345678");
if (wa === "https://wa.me/33612345678") ok("buildVendorWhatsAppPreview normalizes number");
else fail("buildVendorWhatsAppPreview normalizes number", wa ?? "null");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
