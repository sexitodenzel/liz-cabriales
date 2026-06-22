import type { OrderForDisplay } from "@/lib/supabase/orders"

import {
  ADMIN_EMAIL,
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  formatPriceMXN,
  getResend,
  shortId,
} from "./_shared"

const SUPPORT_FALLBACK_EMAIL = "academializcabriales@gmail.com"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

type SendOrderQuestionInput = {
  order: OrderForDisplay
  clientName: string
  clientEmail: string
  productName: string | null
  message: string
}

function buildBody(d: SendOrderQuestionInput): string {
  const productRow = d.productName
    ? `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#555;">Producto consultado</td>
        <td style="padding:6px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">
          ${escapeHtml(d.productName)}
        </td>
      </tr>`
    : ""

  const itemsList = d.order.items
    .map(
      (item) =>
        `<li style="margin:4px 0;">${escapeHtml(item.product_name)}${
          item.variant_name && item.variant_name !== item.product_name
            ? ` — ${escapeHtml(item.variant_name)}`
            : ""
        } · ${item.quantity} × ${formatPriceMXN(item.unit_price)}</li>`
    )
    .join("")

  const safeMessage = escapeHtml(d.message).replace(/\n/g, "<br />")

  return `
    <p style="margin:0 0 18px;font-size:14px;color:${BRAND_BLACK};">
      <strong>${escapeHtml(d.clientName)}</strong> envió una pregunta sobre su pedido.
      Puedes responder directamente a este correo y le llegará a su bandeja.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#555;">Cliente</td>
              <td style="padding:6px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">
                ${escapeHtml(d.clientName)}
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#555;">Correo</td>
              <td style="padding:6px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">
                <a href="mailto:${escapeHtml(d.clientEmail)}" style="color:${BRAND_GOLD};text-decoration:none;">
                  ${escapeHtml(d.clientEmail)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#555;">Pedido</td>
              <td style="padding:6px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;letter-spacing:0.08em;text-align:right;">
                #${shortId(d.order.id)}
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#555;">Total</td>
              <td style="padding:6px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">
                ${formatPriceMXN(d.order.total)}
              </td>
            </tr>
            ${productRow}
          </table>
        </td>
      </tr>
    </table>

    <div style="border-left:3px solid ${BRAND_GOLD};padding:8px 16px;margin-bottom:24px;background:#fbf7ee;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b7a1f;">
        Mensaje
      </p>
      <p style="margin:0;font-size:14px;color:${BRAND_BLACK};line-height:1.6;">
        ${safeMessage}
      </p>
    </div>

    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#9b8b65;">
      Productos del pedido
    </p>
    <ul style="margin:0;padding-left:20px;font-size:13px;color:#555;">
      ${itemsList}
    </ul>
  `
}

export async function sendOrderQuestionEmail(
  input: SendOrderQuestionInput
): Promise<void> {
  const to = ADMIN_EMAIL || SUPPORT_FALLBACK_EMAIL

  const html = buildEmailShell({
    preheader: `Pregunta sobre pedido #${shortId(input.order.id)} de ${input.clientName}`,
    title: "Pregunta sobre pedido",
    badge: {
      label: `Orden #${shortId(input.order.id)}`,
      color: BRAND_BLACK,
      background: BRAND_GOLD,
      border: BRAND_GOLD,
    },
    bodyHtml: buildBody(input),
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    replyTo: input.clientEmail,
    subject: `Pregunta sobre pedido #${shortId(input.order.id)} — ${input.clientName}`,
    html,
  })

  if (error) {
    throw new Error(`[email/order-question] Resend error: ${JSON.stringify(error)}`)
  }
}
