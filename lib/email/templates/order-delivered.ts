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
  users: RawUser | RawUser[] | null
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

export async function sendOrderDeliveredEmail(orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("orders")
    .select("id, total, users ( first_name, last_name, email )")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return

  const raw = data as unknown as RawOrderRow
  const user = unwrap(raw.users)
  if (!user?.email) return

  const recipientName = `${user.first_name} ${user.last_name}`.trim()

  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">
      Hola, ${user.first_name}
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND_BLACK};line-height:1.5;">
      Tu pedido <strong>#${shortId(raw.id)}</strong> fue marcado como entregado.
      ¡Esperamos que todo haya llegado perfecto!
    </p>

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

    <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">
      Si algo no está bien o tienes cualquier duda, escríbenos por WhatsApp y con gusto te ayudamos.
    </p>
    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      ¡Gracias por tu preferencia! Nos encantaría verte de nuevo en la tienda.
    </p>
  `

  const html = buildEmailShell({
    preheader: `Tu pedido #${shortId(raw.id)} fue entregado`,
    title: "¡Tu pedido llegó!",
    badge: {
      label: "Entregado",
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
    subject: `Tu pedido #${shortId(raw.id)} fue entregado — Liz Cabriales`,
    html,
  })

  if (sendError) {
    throw new Error(
      `[email] Resend error order-delivered ${orderId}: ${JSON.stringify(sendError)}`
    )
  }
}
