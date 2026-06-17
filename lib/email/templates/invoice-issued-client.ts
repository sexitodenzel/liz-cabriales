import {
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  formatPriceMXN,
  getResend,
  getSupabaseAdmin,
  shortId,
} from "./_shared"

type InvoiceIssuedData = {
  orderId: string
  orderTotal: number
  clientName: string
  invoiceEmail: string
  rfc: string
  razonSocial: string
  orderUrl: string
}

function buildBody(d: InvoiceIssuedData): string {
  return `
    <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
      Hola <strong>${d.clientName}</strong>, tu factura CFDI ha sido emitida y será enviada
      a <strong>${d.invoiceEmail}</strong> en breve.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#777;">Orden</td>
            <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">
              #${shortId(d.orderId)}
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#777;">RFC</td>
            <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;font-family:monospace;text-align:right;">
              ${d.rfc}
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#777;">Razón social</td>
            <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">
              ${d.razonSocial}
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#777;">Total</td>
            <td style="padding:5px 0;font-size:18px;color:${BRAND_GOLD};font-weight:700;text-align:right;">
              ${formatPriceMXN(d.orderTotal)}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.6;">
      Si tienes alguna duda o no recibes la factura en las próximas horas,
      contáctanos por WhatsApp.
    </p>

    <div style="text-align:center;margin-top:24px;">
      <a href="${d.orderUrl}"
        style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;
               font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
               padding:12px 28px;border-radius:999px;">
        Ver mi orden
      </a>
    </div>
  `
}

type RawOrderRow = {
  id: string
  total: number | string
  rfc: string | null
  razon_social: string | null
  invoice_email: string | null
  users: { first_name: string; last_name: string; email: string } | { first_name: string; last_name: string; email: string }[] | null
}

export async function sendInvoiceIssuedClientEmail(orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lizcabriales.com"

  const { data } = await supabase
    .from("orders")
    .select(`
      id, total, rfc, razon_social, invoice_email,
      users ( first_name, last_name, email )
    `)
    .eq("id", orderId)
    .maybeSingle()

  const order = data as RawOrderRow | null
  if (!order) return

  const users = Array.isArray(order.users) ? order.users[0] : order.users
  const u = users ?? null
  if (!u) return

  const invoiceEmail = order.invoice_email ?? u.email
  const clientName = [u.first_name, u.last_name].filter(Boolean).join(" ")

  const d: InvoiceIssuedData = {
    orderId: order.id,
    orderTotal: Number(order.total),
    clientName,
    invoiceEmail,
    rfc: order.rfc ?? "—",
    razonSocial: order.razon_social ?? "—",
    orderUrl: `${appUrl}/orden/${order.id}`,
  }

  const html = buildEmailShell({
    preheader: `Tu factura CFDI para la orden #${shortId(orderId)} ya fue emitida.`,
    title: "Tu factura CFDI fue emitida",
    badge: {
      label: `Orden #${shortId(orderId)}`,
      color: "#0a0a0a",
      background: BRAND_GOLD,
      border: BRAND_GOLD,
    },
    bodyHtml: buildBody(d),
  })

  const resend = getResend()
  await resend.emails.send({
    from: EMAIL_FROM,
    to: [invoiceEmail],
    subject: `✅ Tu factura CFDI fue emitida — Orden #${shortId(orderId)}`,
    html,
  })
}
