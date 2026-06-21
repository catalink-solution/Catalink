import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.RESEND_FROM ?? "Catalink <onboarding@resend.dev>";

export type OrderEmailPayload = {
  to: string;
  shopName: string;
  shopSlug: string;
  orderId: string;
  customerName: string;
  total: number;
  itemCount: number;
};

export async function sendOrderNotificationEmail(
  payload: OrderEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const shortId = payload.orderId.slice(0, 8);
  const total = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(payload.total);

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: `Nouvelle commande · ${payload.shopName} · ${total}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
        <h1 style="font-size:20px;margin-bottom:8px">Nouvelle commande reçue</h1>
        <p style="color:#555;margin-top:0">Tu as reçu une nouvelle commande sur <strong>${escapeHtml(payload.shopName)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px 0;color:#666">N° commande</td><td style="padding:8px 0;font-family:monospace">${shortId}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Client</td><td style="padding:8px 0">${escapeHtml(payload.customerName)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Articles</td><td style="padding:8px 0">${payload.itemCount}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Total</td><td style="padding:8px 0;font-weight:700">${total}</td></tr>
        </table>
        <a href="${origin}/dashboard/orders" style="display:inline-block;background:linear-gradient(to right,#3b82f6,#7c3aed);color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Voir la commande
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">Catalink · ${escapeHtml(payload.shopSlug)}</p>
      </div>
    `,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
