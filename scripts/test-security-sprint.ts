/**
 * Security sprint regression checks (static / env).
 * Usage: npx tsx scripts/test-security-sprint.ts
 */

import { isPublicSignupAllowed, PUBLIC_SIGNUP_DEFAULT } from "../lib/signup-config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

if (PUBLIC_SIGNUP_DEFAULT === false) ok("PUBLIC_SIGNUP_DEFAULT is false");
else fail("PUBLIC_SIGNUP_DEFAULT is false");

if (!isPublicSignupAllowed()) ok("isPublicSignupAllowed() false by default");
else fail("isPublicSignupAllowed() false by default");

try {
  if (!fs.existsSync(path.join(root, "app/admin/debug/page.tsx"))) {
    ok("/admin/debug page removed");
  } else fail("/admin/debug page removed");

  if (!fs.existsSync(path.join(root, "app/api/admin/debug/route.ts"))) {
    ok("/api/admin/debug route removed");
  } else fail("/api/admin/debug route removed");

  const layout = fs.readFileSync(path.join(root, "app/[slug]/layout.tsx"), "utf8");
  const storefrontShop = fs.readFileSync(path.join(root, "lib/storefront-shop.ts"), "utf8");
  const hasSuspensionGate =
    layout.includes("is_suspended") &&
    layout.includes("ShopUnavailable") &&
    layout.includes("fetchStorefrontShopBySlug");
  const usesPublicView = storefrontShop.includes("shops_storefront");
  if (hasSuspensionGate && usesPublicView) {
    ok("storefront layout suspension gate");
  } else fail("storefront layout suspension gate");

  const migration = fs.readFileSync(
    path.join(root, "supabase/migrations/20260623120000_security_sprint_pre_launch.sql"),
    "utf8"
  );
  if (migration.includes("DROP POLICY") && migration.includes("shops_storefront")) {
    ok("security migration file present");
  } else fail("security migration file present");

  const registerForm = fs.readFileSync(path.join(root, "app/register/register-form.tsx"), "utf8");
  if (registerForm.includes("isPublicSignupAllowed")) {
    ok("register-form blocks signup when closed");
  } else fail("register-form blocks signup when closed");
} catch (e) {
  fail("filesystem checks", e instanceof Error ? e.message : String(e));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
