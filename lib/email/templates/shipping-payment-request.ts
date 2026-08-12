import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  emailButton,
  formatPriceMXN,
  getResend,
  getSupabaseAdmin,
  shortId,
} from "./_shared"

type RawUser = { first_name: string; last_name: string; email: string }
type RawOrderRow = {
  id: string
  shipping_amount_final: number | string | null
  shipping_payment_url: string | null
  carrier: string | null
  users: RawUser | RawUser[] | null
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

export async function sendShippingPaymentRequestEmail(
  orderId: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, shipping_amount_final, shipping_payment_url, carrier, users ( first_name, last_name, email )"
    )
    .eq("id", orderId)
    .maybeSingle()

  // Estos tres cortes salían mudos: si alguno se cumplía, el correo no se
  // mandaba y no quedaba rastro en ningún lado. Un fallo silencioso en el aviso
  // de "págame el envío" significa un cliente que nunca paga y nadie se entera.
  if (error || !data) {
    console.error(
      `[shipping-payment-request] No se pudo leer la orden ${orderId}:`,
      error
    )
    return
  }

  const raw = data as unknown as RawOrderRow
  const user = unwrap(raw.users)
  if (!user?.email) {
    console.error(
      `[shipping-payment-request] La orden ${orderId} no tiene correo de cliente. Sin destinatario, no se envía.`
    )
    return
  }

  const amount = raw.shipping_amount_final != null
    ? Number(raw.shipping_amount_final)
    : null
  const paymentUrl = raw.shipping_payment_url
  if (!amount || !paymentUrl) {
    console.error(
      `[shipping-payment-request] Orden ${orderId} sin cotización utilizable ` +
      `(shipping_amount_final=${String(raw.shipping_amount_final)}, ` +
      `shipping_payment_url=${paymentUrl ? "presente" : "ausente"}). No se envía.`
    )
    return
  }

  const recipientName = `${user.first_name} ${user.last_name}`.trim()
  const carrierLabel = raw.carrier ?? "nuestra paquetería"

  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9a9a9a;">
      Hola, ${user.first_name}
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND_BLACK};line-height:1.5;">
      Ya cotizamos el envío de tu pedido <strong>#${shortId(raw.id)}</strong>.
      Lo mandaremos con <strong>${carrierLabel}</strong> y solo te falta cubrir el costo del envío para que salgamos a dártelo.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #ececec;border-radius:12px;margin-bottom:24px;">
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
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Costo de envío</td>
            <td style="padding:5px 0;font-size:18px;color:${BRAND_GOLD};font-weight:700;text-align:right;">${formatPriceMXN(amount)}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="margin-bottom:24px;">
      <tr>
        <td align="center">
          ${emailButton(paymentUrl, `Pagar envío — ${formatPriceMXN(amount)}`)}
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">
      El pago es seguro a través de MercadoPago. Una vez que lo completes, preparamos tu paquete y te avisamos cuando salga.
    </p>
    <p style="margin:0;font-size:13px;color:#9a9a9a;">
      ¿Dudas? Escríbenos por WhatsApp y con gusto te ayudamos.
    </p>
  `

  const html = buildEmailShell({
    preheader: `Cotización de envío lista — Pedido #${shortId(raw.id)} · ${formatPriceMXN(amount)}`,
    title: "Tu envío está listo",
    badge: {
      label: "Acción requerida",
      color: BRAND_BLACK,
      background: BRAND_GOLD,
      border: BRAND_GOLD,
    },
    bodyHtml: body,
  })

  const resend = getResend()
  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName ? [`${recipientName} <${user.email}>`] : [user.email],
    subject: `Paga tu envío y listo — Pedido #${shortId(raw.id)} — Liz Cabriales`,
    html,
  })

  if (sendError) {
    throw new Error(
      `[email] Resend error shipping-payment-request ${orderId}: ${JSON.stringify(sendError)}`
    )
  }
}
