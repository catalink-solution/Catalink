import { createAdminClient } from "@/lib/supabase-admin";

export const APP_ERROR_ACTIONS = {
  PRODUCT_CREATE: "product_create",
  PRODUCT_UPDATE: "product_update",
  PRODUCT_UPLOAD_IMAGE: "product_upload_image",
  ORDER_CREATE: "order_create",
  AUTH_LOGIN: "auth_login",
  AUTH_PASSWORD_RESET_REQUEST: "auth_password_reset_request",
  AUTH_PASSWORD_RESET_UPDATE: "auth_password_reset_update",
  WAITLIST_SUBMIT: "waitlist_submit",
  DASHBOARD_ORDERS: "dashboard_orders",
  API_EMAIL_ORDER: "api_email_order",
  API_EMAIL_ORDER_STATUS: "api_email_order_status",
  API_AI_IMPORT: "api_ai_import",
} as const;

export type AppErrorAction = (typeof APP_ERROR_ACTIONS)[keyof typeof APP_ERROR_ACTIONS];

/** Actions autorisées sans session (checkout, login). */
export const PUBLIC_APP_ERROR_ACTIONS = new Set<string>([
  APP_ERROR_ACTIONS.ORDER_CREATE,
  APP_ERROR_ACTIONS.AUTH_LOGIN,
  APP_ERROR_ACTIONS.AUTH_PASSWORD_RESET_REQUEST,
  APP_ERROR_ACTIONS.WAITLIST_SUBMIT,
]);

export type AppErrorLogInput = {
  userId?: string | null;
  email?: string | null;
  route?: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
};

function truncateMessage(message: string, max = 2000): string {
  const trimmed = message.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

/** Persiste une erreur (fire-and-forget côté appelant). */
export async function logAppError(input: AppErrorLogInput): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;

    await admin.from("app_error_logs").insert({
      user_id: input.userId ?? null,
      email: input.email?.trim().toLowerCase() ?? null,
      route: (input.route ?? "").slice(0, 500),
      action: input.action.slice(0, 100),
      message: truncateMessage(input.message),
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error("[app_error_log] persist failed:", err);
  }
}
