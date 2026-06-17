import {
  ADMIN_EMAIL,
  BRAND_GOLD,
  EMAIL_FROM,
  formatPriceMXN,
  getResend,
  getSupabaseAdmin,
  shortId,
} from "./_shared"

type InvoiceReceivedData = {
  orderId: string
  orderTotal: number
  clientName: string
  clientEmail: string
  invoiceEmail: string
  rfc: string
  razonSocial: string
  constanciaUrl: string | null
  adminOrderUrl: string
}

function buildHtml(d: InvoiceReceivedData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr>
        <td style="background:#0a0a0a;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:${BRAND_GOLD};">
            Panel Admin — Liz Cabriales
          </p>
          <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fff;">
            Nueva solicitud de factura
          </p>
          <p style="margin:12px 0 0;">
            <span style="display:inline-block;padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#0a0a0a;background:${BRAND_GOLD};border-radius:999px;">
              Orden #${shortId(d.orderId)}
            </span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#fff;padding:28px 32px;border-left:1px solid #e8e1d3;border-right:1px solid #e8e1d3;">
          <p style="margin:0 0 20px;font-size:14px;color:#555;">
            Un cliente solicitó factura CFDI para su pedido. Aquí están sus datos:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#777;">Cliente</td>
                  <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">${d.clientName}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#777;">Correo cuenta</td>
                  <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">${d.clientEmail}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#777;">Correo factura</td>
                  <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">${d.invoiceEmail}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#777;">RFC</td>
                  <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;font-family:monospace;text-align:right;">${d.rfc}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#777;">Razón social</td>
                  <td style="padding:5px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">${d.razonSocial}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:12px;margin-bottom:20px;">
            <tr><td style="padding:14px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#fff;">Total de la orden</td>
                  <td style="font-size:18px;font-weight:700;color:${BRAND_GOLD};text-align:right;">${formatPriceMXN(d.orderTotal)}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          ${d.constanciaUrl
            ? `<p style="margin:0 0 16px;font-size:13px;color:#555;">
                Constancia fiscal subida:
                <a href="${d.constanciaUrl}" style="color:${BRAND_GOLD};font-weight:600;">Ver documento</a>
               </p>`
            : `<p style="margin:0 0 16px;font-size:13px;color:#e57373;">
                ⚠️ El cliente aún no ha subido la constancia fiscal.
               </p>`
          }

          <p style="margin:0 0 6px;font-size:13px;color:#555;">
            📸 El cliente debe subir la foto de su ticket desde su página de orden una vez que pague.
          </p>

          <div style="text-align:center;margin-top:24px;">
            <a href="${d.adminOrderUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:12px 28px;border-radius:999px;">
              Ver orden en panel admin
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#f4f0e8;border:1px solid #e8e1d3;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9b8b65;">Academia Liz Cabriales · Panel administrativo</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

type RawOrderRow = {
  id: string
  total: number | string
  rfc: string | null
  razon_social: string | null
  invoice_email: string | null
  constancia_fiscal_url: string | null
  users: { first_name: string; last_name: string; email: string } | { first_name: string; last_name: string; email: string }[] | null
}

export async function sendInvoiceReceivedAdminEmail(orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lizcabriales.com"

  const { data } = await supabase
    .from("orders")
    .select(`
      id, total, rfc, razon_social, invoice_email, constancia_fiscal_url,
      users ( first_name, last_name, email )
    `)
    .eq("id", orderId)
    .maybeSingle()

  const order = data as RawOrderRow | null
  if (!order) return

  const users = Array.isArray(order.users) ? order.users[0] : order.users
  const u = users ?? null
  if (!u) return

  const invoiceData: InvoiceReceivedData = {
    orderId: order.id,
    orderTotal: Number(order.total),
    clientName: [u.first_name, u.last_name].filter(Boolean).join(" "),
    clientEmail: u.email,
    invoiceEmail: order.invoice_email ?? u.email,
    rfc: order.rfc ?? "—",
    razonSocial: order.razon_social ?? "—",
    constanciaUrl: order.constancia_fiscal_url,
    adminOrderUrl: `${appUrl}/admin/orders/${order.id}`,
  }

  const resend = getResend()
  await resend.emails.send({
    from: EMAIL_FROM,
    to: [ADMIN_EMAIL],
    subject: `📄 Nueva solicitud de factura — Orden #${shortId(orderId)}`,
    html: buildHtml(invoiceData),
  })
}
