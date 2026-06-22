/**
 * Tests protection admin plateforme.
 * Usage: ADMIN_EMAIL=admin@test.com npx tsx scripts/test-admin-protection.ts
 */

import {
  assertNotPlatformAdmin,
  CANNOT_MODIFY_PLATFORM_ADMIN,
  isProtectedAdminAction,
  PlatformAdminProtectedError,
} from "../lib/admin/protection";
import { isAdminEmail } from "../lib/admin/auth";

process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@test.com";

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

if (isAdminEmail("admin@test.com")) ok("isAdminEmail matches ADMIN_EMAIL");
else fail("isAdminEmail matches ADMIN_EMAIL");

if (!isAdminEmail("vendor@test.com")) ok("isAdminEmail rejects vendor");
else fail("isAdminEmail rejects vendor");

try {
  assertNotPlatformAdmin("vendor@test.com");
  ok("assertNotPlatformAdmin allows vendor");
} catch {
  fail("assertNotPlatformAdmin allows vendor");
}

try {
  assertNotPlatformAdmin("admin@test.com");
  fail("assertNotPlatformAdmin blocks admin");
} catch (e) {
  if (e instanceof PlatformAdminProtectedError && e.message === CANNOT_MODIFY_PLATFORM_ADMIN) {
    ok("assertNotPlatformAdmin blocks admin with correct error");
  } else {
    fail("assertNotPlatformAdmin blocks admin", String(e));
  }
}

for (const action of ["suspend", "activate", "update_subscription"]) {
  if (isProtectedAdminAction(action)) ok(`action '${action}' is protected`);
  else fail(`action '${action}' is protected`);
}

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function httpTests() {
  console.log("\n--- HTTP (optional) ---");

  const resNoToken = await fetch(`${base}/api/auth/context`);
  if (resNoToken.status === 401) ok("GET /api/auth/context sans token → 401");
  else fail("GET /api/auth/context sans token → 401", String(resNoToken.status));

  const adminToken = process.env.TEST_ADMIN_TOKEN;
  const platformAdminUserId = process.env.TEST_PLATFORM_ADMIN_USER_ID;

  if (adminToken && platformAdminUserId) {
    const suspendRes = await fetch(`${base}/api/admin/users/${platformAdminUserId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "suspend", shopId: "fake" }),
    });
    if (suspendRes.status === 403) {
      const json = (await suspendRes.json()) as { error?: string };
      if (json.error === CANNOT_MODIFY_PLATFORM_ADMIN) {
        ok("PATCH suspend platform admin → 403 cannot_modify_platform_admin");
      } else {
        fail("PATCH suspend platform admin → 403", json.error);
      }
    } else {
      fail("PATCH suspend platform admin → 403", String(suspendRes.status));
    }

    const subRes = await fetch(`${base}/api/admin/users/${platformAdminUserId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update_subscription",
        shopId: "fake",
        plan: "free",
      }),
    });
    if (subRes.status === 403) ok("PATCH update_subscription platform admin → 403");
    else fail("PATCH update_subscription platform admin → 403", String(subRes.status));
  } else {
    console.log("  (skip HTTP admin tests — set TEST_ADMIN_TOKEN + TEST_PLATFORM_ADMIN_USER_ID)");
  }

  if (adminToken) {
    const usersRes = await fetch(`${base}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (usersRes.ok) {
      const json = (await usersRes.json()) as {
        users?: { isProtectedAdmin?: boolean }[];
      };
      if (json.users?.some((u) => u.isProtectedAdmin)) {
        ok("GET /api/admin/users includes isProtectedAdmin");
      } else {
        fail("GET /api/admin/users includes isProtectedAdmin");
      }
    } else {
      fail("GET /api/admin/users", String(usersRes.status));
    }
  }
}

httpTests()
  .then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
