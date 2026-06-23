/**
 * Sprint 4C — vendor onboarding checks.
 * Usage: npx tsx scripts/test-vendor-onboarding-sprint.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildOnboardingSteps,
  onboardingProgress,
  isOnboardingComplete,
} from "../lib/vendor-onboarding";

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

if (fs.existsSync(path.join(root, "app/dashboard/welcome/page.tsx"))) {
  ok("welcome page exists at /dashboard/welcome");
} else {
  fail("welcome page exists at /dashboard/welcome");
}

const layout = fs.readFileSync(path.join(root, "app/dashboard/layout.tsx"), "utf8");
if (layout.includes("OnboardingBanner")) ok("dashboard layout includes onboarding banner");
else fail("dashboard layout includes onboarding banner");

const banner = fs.readFileSync(
  path.join(root, "components/dashboard/onboarding-banner.tsx"),
  "utf8"
);
if (banner.includes("Complétez votre configuration") && banner.includes("progress")) {
  ok("onboarding banner shows progress CTA");
} else {
  fail("onboarding banner shows progress CTA");
}

const onboardingLib = fs.readFileSync(path.join(root, "lib/vendor-onboarding.ts"), "utf8");
for (const key of ["shop", "whatsapp", "product", "order", "share"]) {
  if (!onboardingLib.includes(`id: "${key}"`)) {
    fail(`onboarding step ${key} defined`);
  }
}
ok("all 5 onboarding steps defined");

const empty = buildOnboardingSteps({
  shop: null,
  productCount: 0,
  orderCount: 0,
  sharedStorefront: false,
});
if (onboardingProgress(empty) === 0) ok("empty onboarding progress is 0%");
else fail("empty onboarding progress is 0%");

const partial = buildOnboardingSteps({
  shop: { id: "1", name: "Test", slug: "test", whatsapp: "+33601020304" },
  productCount: 1,
  orderCount: 0,
  sharedStorefront: false,
});
if (onboardingProgress(partial) === 60) ok("partial onboarding progress 60% (3/5)");
else fail("partial onboarding progress 60%", String(onboardingProgress(partial)));

const full = buildOnboardingSteps({
  shop: { id: "1", name: "Test", slug: "test", whatsapp: "+33601020304" },
  productCount: 2,
  orderCount: 1,
  sharedStorefront: true,
});
if (isOnboardingComplete(full) && onboardingProgress(full) === 100) {
  ok("complete onboarding is 100%");
} else {
  fail("complete onboarding is 100%");
}

for (const [page, file] of [
  ["shop", "app/dashboard/shop/page.tsx"],
  ["products", "app/dashboard/products/page.tsx"],
  ["orders", "app/dashboard/orders/page.tsx"],
] as const) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  if (content.includes("ContextualTip")) ok(`contextual tip on ${page} page`);
  else fail(`contextual tip on ${page} page`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
