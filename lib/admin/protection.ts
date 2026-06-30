import { isAdminEmail } from "./auth";

/** Code d'erreur API lorsqu'une action vise le compte admin plateforme. */
export const CANNOT_MODIFY_PLATFORM_ADMIN = "cannot_modify_platform_admin";

export const CANNOT_DELETE_SELF = "cannot_delete_self";
export const USER_HAS_ORDERS = "user_has_orders";

export class PlatformAdminProtectedError extends Error {
  constructor(message = CANNOT_MODIFY_PLATFORM_ADMIN) {
    super(message);
    this.name = "PlatformAdminProtectedError";
  }
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}

/** Bloque toute action destructive sur ADMIN_EMAIL. */
export function assertNotPlatformAdmin(email: string | null | undefined): void {
  if (isPlatformAdminEmail(email)) {
    throw new PlatformAdminProtectedError();
  }
}

/** Actions admin interdites sur le compte plateforme (suspend, plan, ban, etc.). */
export const PROTECTED_ADMIN_ACTIONS = new Set([
  "suspend",
  "activate",
  "update_subscription",
  "delete",
  "ban",
  "deactivate",
  "delete_shop",
]);

export function isProtectedAdminAction(action: string): boolean {
  return PROTECTED_ADMIN_ACTIONS.has(action);
}
