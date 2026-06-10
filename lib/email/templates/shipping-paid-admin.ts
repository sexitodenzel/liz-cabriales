import {
  ADMIN_EMAIL,
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
  tracking_number: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  users: RawUser | RawUser[] | null
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

export async function sendShippingPaidAdminEmail(orderId: string): Promise<void> {
  if (!ADMIN_EMAIL) return

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, total, shipping_amount_final, carrier, tracking_number,
       shipping_address, shipping_city, shipping_state,
       users ( first_name, last_name, email )`
    )
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return

  const raw = data as unknown as RawOrderRow
  const user = unwrap(raw.users)
  const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : "—"
  const clientEmail = user?.email ?? "—"

  const shippingAmount = raw.shipping_amount_final != null
    ? formatPriceMXN(Number(raw.shipping_amount_final))
    : "—"

  const addressParts = [raw.shipping_address, raw.shipping_city, raw.shipping_state]
    .filter(Boolean)
    .join(", ")

  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND_BLACK};line-height:1.5;">
      El cliente pagó el envío de su pedido. Ya puedes comprar la guía y preparar el paquete.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Pedido</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(raw.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Cliente</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Email</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${clientEmail}</td>
          </tr>
          ${addressParts ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Dirección</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${addressParts}</td>
          </tr>` : ""}
          ${raw.carrier ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Paquetería</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${raw.carrier}</td>
          </tr>` : ""}
          ${raw.tracking_number ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Guía</td>
            <td style="padding:5px 0;font-size:13px;font-family:monospace;color:${BRAND_BLACK};font-weight:700;text-align:right;">${raw.tracking_number}</td>
          </tr>` : ""}
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color:${BRAND_BLACK};border-radius:12px;">
      <tr><td style="padding:14px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#fff;">Envío cobrado</td>
            <td style="font-size:18px;font-weight:700;color:${BRAND_GOLD};text-align:right;">${shippingAmount}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  `

  const html = buildEmailShell({
    preheader: `Envío pagado — Pedido #${shortId(raw.id)} · ${clientName}`,
    title: "Envío pagado",
    badge: {
      label: "Notificación interna",
      color: "#ffffff",
      background: BRAND_BLACK,
      border: BRAND_BLACK,
    },
    bodyHtml: body,
  })

  const resend = getResend()
  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [ADMIN_EMAIL],
    subject: `[Admin] Envío pagado — Pedido #${shortId(raw.id)} · ${clientName}`,
    html,
  })

  if (sendError) {
    throw new Error(
      `[email] Resend error shipping-paid-admin ${orderId}: ${JSON.stringify(sendError)}`
    )
  }
}
