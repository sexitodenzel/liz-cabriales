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
  carrier: string | null
  tracking_number: string | null
  users: RawUser | RawUser[] | null
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

export async function sendOrderShippedEmail(orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("orders")
    .select("id, total, carrier, tracking_number, users ( first_name, last_name, email )")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return

  const raw = data as unknown as RawOrderRow
  const user = unwrap(raw.users)
  if (!user?.email) return

  const recipientName = `${user.first_name} ${user.last_name}`.trim()
  const hasTracking = raw.carrier || raw.tracking_number

  const trackingBlock = hasTracking
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${raw.carrier ? `<tr>
              <td style="padding:5px 0;font-size:13px;color:#555;">Paquetería</td>
              <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${raw.carrier}</td>
            </tr>` : ""}
            ${raw.tracking_number ? `<tr>
              <td style="padding:5px 0;font-size:13px;color:#555;">Guía</td>
              <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;letter-spacing:0.06em;text-align:right;">${raw.tracking_number}</td>
            </tr>` : ""}
          </table>
        </td></tr>
      </table>`
    : ""

  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">
      Hola, ${user.first_name}
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND_BLACK};line-height:1.5;">
      Tu pedido <strong>#${shortId(raw.id)}</strong> ya está en camino. ¡Pronto lo tendrás!
    </p>

    ${hasTracking ? `<p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">Datos de envío</p>` : ""}
    ${trackingBlock}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color:${BRAND_BLACK};border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:14px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#fff;">Total del pedido</td>
            <td style="font-size:18px;font-weight:700;color:${BRAND_GOLD};text-align:right;">${formatPriceMXN(Number(raw.total))}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      Conserva este correo como comprobante. Tu referencia de pedido es
      <strong style="color:${BRAND_GOLD};">#${shortId(raw.id)}</strong>.
    </p>
  `

  const html = buildEmailShell({
    preheader: `Tu pedido #${shortId(raw.id)} está en camino`,
    title: "Tu pedido está en camino",
    badge: {
      label: "Enviado",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })

  const resend = getResend()
  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName
      ? [`${recipientName} <${user.email}>`]
      : [user.email],
    subject: `Tu pedido #${shortId(raw.id)} está en camino — Liz Cabriales`,
    html,
  })

  if (sendError) {
    throw new Error(
      `[email] Resend error orden enviada ${orderId}: ${JSON.stringify(sendError)}`
    )
  }
}
