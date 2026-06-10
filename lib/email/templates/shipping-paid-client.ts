import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  formatPriceMXN,
  getResend,
  getSupabaseAdmin,
  shortId,
} from "./_shared"

type RawUser = { first_name: string; last_name: string; email: string }
type RawOrderRow = {
  id: string
  total: number | string
  shipping_amount_final: number | string | null
  carrier: string | null
  users: RawUser | RawUser[] | null
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

export async function sendShippingPaidClientEmail(orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("orders")
    .select("id, total, shipping_amount_final, carrier, users ( first_name, last_name, email )")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return

  const raw = data as unknown as RawOrderRow
  const user = unwrap(raw.users)
  if (!user?.email) return

  const recipientName = `${user.first_name} ${user.last_name}`.trim()
  const carrierLabel = raw.carrier ?? "nuestra paquetería"
  const shippingAmount =
    raw.shipping_amount_final != null
      ? formatPriceMXN(Number(raw.shipping_amount_final))
      : null

  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">
      ¡Todo listo, ${user.first_name}!
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND_BLACK};line-height:1.5;">
      Recibimos tu pago de envío para el pedido <strong>#${shortId(raw.id)}</strong>.
      Ya estamos preparando tu paquete para enviarlo con <strong>${carrierLabel}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Pedido</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(raw.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Paquetería</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${carrierLabel}</td>
          </tr>
          ${shippingAmount ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Envío pagado</td>
            <td style="padding:5px 0;font-size:13px;color:#16a34a;font-weight:700;text-align:right;">${shippingAmount}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Total del pedido</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">${formatPriceMXN(Number(raw.total))}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">
      En cuanto tu paquete salga te avisamos con el número de guía para que puedas rastrearlo.
    </p>
    <p style="margin:0;font-size:13px;color:#9b8b65;">
      Gracias por tu compra. ¡Esperamos que te encante!
    </p>
  `

  const html = buildEmailShell({
    preheader: `Pago de envío recibido — Pedido #${shortId(raw.id)}`,
    title: "Pago de envío confirmado",
    badge: {
      label: "Envío pagado",
      color: "#14532d",
      background: "#dcfce7",
      border: "#86efac",
    },
    bodyHtml: body,
  })

  const resend = getResend()
  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName ? [`${recipientName} <${user.email}>`] : [user.email],
    subject: `Pago de envío recibido — Pedido #${shortId(raw.id)} — Liz Cabriales`,
    html,
  })

  if (sendError) {
    throw new Error(
      `[email] Resend error shipping-paid-client ${orderId}: ${JSON.stringify(sendError)}`
    )
  }
}
