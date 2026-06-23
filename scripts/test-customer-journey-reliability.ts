/**
 * Sprint 3 — customer journey reliability checks.
 * Usage: npx tsx scripts/test-customer-journey-reliability.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { escapeHtml } from "../lib/escape-html";
import { isOrderTrackingPath } from "../lib/storefront-routes";
import { buildCustomerNotificationHtml } from "../lib/order-notification-templates";

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

// 1. Suspended shop + order page accessible
const slugLayout = fs.readFileSync(path.join(root, "app/[slug]/layout.tsx"), "utf8");
const routesLib = fs.readFileSync(path.join(root, "lib/storefront-routes.ts"), "utf8");

if (
  slugLayout.includes("isOrderTrackingPath") &&
  slugLayout.includes("shop.is_suspended && !orderPage") &&
  slugLayout.includes("orderPage && shop.is_suspended")
) {
  ok("suspended shop: catalog blocked, order page bypass in layout");
} else {
  fail("suspended shop: catalog blocked, order page bypass in layout");
}

if (isOrderTrackingPath("/demo/order/abc-123", "demo")) ok("isOrderTrackingPath matches order URL");
else fail("isOrderTrackingPath matches order URL");

if (!isOrderTrackingPath("/demo/checkout", "demo")) ok("isOrderTrackingPath excludes checkout");
else fail("isOrderTrackingPath excludes checkout");

const orderClient = fs.readFileSync(
  path.join(root, "app/[slug]/order/[orderId]/order-page-client.tsx"),
  "utf8");
if (!orderClient.includes("shopRes.data?.is_suspended")) {
  ok("order page client does not block on is_suspended");
} else {
  fail("order page client does not block on is_suspended");
}

// 2. updateStatus fails => no optimistic patch before DB
const ordersPage = fs.readFileSync(path.join(root, "app/dashboard/orders/page.tsx"), "utf8");
const updateBlock = ordersPage.slice(
  ordersPage.indexOf("async function updateStatus"),
  ordersPage.indexOf("async function saveTracking")
);
if (
  updateBlock.includes("await supabase.from(\"orders\").update") &&
  updateBlock.indexOf("patchOrder") > updateBlock.indexOf("if (error)")
) {
  ok("updateStatus patches local state only after DB success");
} else {
  fail("updateStatus patches local state only after DB success");
}

const refreshBlock = ordersPage.slice(
  ordersPage.indexOf("async function refreshStatus"),
  ordersPage.indexOf("function setDraft")
);
if (
  refreshBlock.includes("if (updateError)") &&
  refreshBlock.indexOf("patchOrder") > refreshBlock.indexOf("if (updateError)")
) {
  ok("refreshStatus patches local state only after DB success");
} else {
  fail("refreshStatus patches local state only after DB success");
}

// 3. notifyCustomer handles HTTP errors
if (
  ordersPage.includes("if (!res.ok)") &&
  ordersPage.includes("sellerNotifyHttpError")
) {
  ok("notifyCustomer checks res.ok and surfaces seller errors");
} else {
  fail("notifyCustomer checks res.ok and surfaces seller errors");
}

// 4. Manual fallback always returned from API
const orderStatusApi = fs.readFileSync(
  path.join(root, "app/api/email/order-status/route.ts"),
  "utf8");
if (
  orderStatusApi.includes("messageText") &&
  orderStatusApi.includes("manualFallbackRequired") &&
  orderStatusApi.includes("orderNumber") &&
  orderStatusApi.includes("orderPageUrl") &&
  !orderStatusApi.includes("admin_not_configured")
) {
  ok("order-status API always builds manual fallback payload (no admin gate)");
} else {
  fail("order-status API always builds manual fallback payload");
}

// 5. escape HTML
const raw = '<script>alert("x")</script> & Co';
const escaped = escapeHtml(raw);
if (!escaped.includes("<script>") && escaped.includes("&lt;script&gt;") && escaped.includes("&amp;")) {
  ok("escapeHtml neutralizes HTML and ampersands");
} else {
  fail("escapeHtml neutralizes HTML and ampersands");
}

const html = buildCustomerNotificationHtml("confirmed", {
  orderId: "abc123456789",
  shopName: 'Boutique "Test" & Co',
  shopSlug: "test",
  customerName: "<Jean>",
  total: 42,
  items: [{ product_name: "Produit <A>", quantity: 1, unit_price: 42, size: null, variant_label: null }],
  trackingNumber: "TR<123>",
  trackingCarrier: "DHL & Co",
  orderPageUrl: "https://example.com/x?y=1&z=2",
});
if (
  !html.includes("<Jean>") &&
  !html.includes("Produit <A>") &&
  html.includes("&lt;Jean&gt;") &&
  html.includes("&lt;A&gt;")
) {
  ok("buildCustomerNotificationHtml escapes injected text values");
} else {
  fail("buildCustomerNotificationHtml escapes injected text values");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
