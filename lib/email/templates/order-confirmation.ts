export type OrderConfirmationData = {
  customerFirstName: string
  customerLastName: string
  orderShortId: string
  createdAt: string
  items: Array<{
    productName: string
    variantName: string
    quantity: number
    unitPrice: number
  }>
  total: number
  shippingCost: number
  shippingAmountFinal: number | null
  deliveryType: "shipping" | "pickup"
  shippingAddress: string | null
  shippingCity: string | null
  shippingState: string | null
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(iso: string): string {
  try {
    const dt = new Date(iso)
    const date = dt.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    const time = dt.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return `${date}, ${time}`
  } catch {
    return iso
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const MONO_FONT =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', 'Roboto Mono', 'Courier New', monospace"

function dottedDivider(): string {
  return `
    <tr>
      <td style="padding:14px 0;">
        <div style="border-top:1px dashed #d4d4d4;font-size:0;line-height:0;">&nbsp;</div>
      </td>
    </tr>`
}

function solidDivider(): string {
  return `
    <tr>
      <td style="padding:14px 0;">
        <div style="border-top:1px solid #0a0a0a;font-size:0;line-height:0;">&nbsp;</div>
      </td>
    </tr>`
}

function ticketRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:3px 0;font-family:${MONO_FONT};font-size:13px;color:#8a8a8a;text-transform:uppercase;letter-spacing:0.12em;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:3px 0;font-family:${MONO_FONT};font-size:13px;color:#0a0a0a;text-align:right;">
        ${escapeHtml(value)}
      </td>
    </tr>`
}

function renderItem(item: OrderConfirmationData["items"][number]): string {
  const meta =
    item.variantName && item.variantName !== item.productName
      ? `${item.quantity} x ${formatPrice(item.unitPrice)} · ${escapeHtml(item.variantName)}`
      : `${item.quantity} x ${formatPrice(item.unitPrice)}`

  return `
    <tr>
      <td style="padding:6px 8px 6px 0;font-family:${MONO_FONT};font-size:13px;color:#0a0a0a;vertical-align:top;">
        ${escapeHtml(item.productName)}
        <div style="margin-top:2px;font-size:12px;color:#8a8a8a;">${meta}</div>
      </td>
      <td style="padding:6px 0;font-family:${MONO_FONT};font-size:13px;font-weight:600;color:#0a0a0a;text-align:right;vertical-align:top;white-space:nowrap;">
        ${formatPrice(item.quantity * item.unitPrice)}
      </td>
    </tr>`
}

export function buildOrderConfirmationHtml(
  data: OrderConfirmationData
): string {
  const itemsSubtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const shipping =
    data.deliveryType === "shipping"
      ? data.shippingAmountFinal ?? data.shippingCost ?? 0
      : 0
  const extras = Math.round(data.total - itemsSubtotal - shipping)

  const itemsRows = data.items.map(renderItem).join("")

  const totalsRows: string[] = [ticketRow("Subtotal", formatPrice(itemsSubtotal))]
  if (data.deliveryType === "shipping") {
    totalsRows.push(
      ticketRow(
        "Envio",
        shipping > 0 ? formatPrice(shipping) : "Por calcular"
      )
    )
  }
  if (extras > 0) {
    totalsRows.push(ticketRow("Factura / ajustes", formatPrice(extras)))
  }

  const deliveryLabel =
    data.deliveryType === "shipping" ? "Envio a domicilio" : "Retiro en local"

  const addressBlock =
    data.deliveryType === "shipping" && data.shippingAddress
      ? `
        <tr>
          <td colspan="2" style="padding:10px 0 0;font-family:${MONO_FONT};">
            <div style="font-size:11px;color:#8a8a8a;text-transform:uppercase;letter-spacing:0.12em;">
              Direccion
            </div>
            <div style="margin-top:4px;font-size:12px;color:#0a0a0a;line-height:1.5;white-space:pre-line;">
${escapeHtml(data.shippingAddress)}${
          data.shippingCity && data.shippingState
            ? `\n${escapeHtml(data.shippingCity)}, ${escapeHtml(data.shippingState)}`
            : ""
        }
            </div>
          </td>
        </tr>`
      : ""

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pedido — Liz Cabriales</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0e8;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Tu ticket digital del pedido #${data.orderShortId} · Total ${formatPrice(data.total)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f0e8;padding:32px 16px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;">

          <!-- Saludo -->
          <tr>
            <td style="padding:0 0 18px;font-size:14px;color:#5a5a5a;text-align:center;line-height:1.6;">
              Hola, <strong style="color:#0a0a0a;">${escapeHtml(data.customerFirstName)}</strong>. Recibimos tu pago — aquí va tu ticket digital.
            </td>
          </tr>

          <!-- Ticket -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e5e5e5;padding:28px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.04);">

              <!-- Encabezado -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="text-align:center;font-family:${MONO_FONT};">
                    <div style="font-size:16px;font-weight:700;letter-spacing:0.26em;color:#0a0a0a;">
                      LIZ CABRIALES
                    </div>
                    <div style="margin-top:6px;font-size:10px;letter-spacing:0.32em;color:#8a8a8a;text-transform:uppercase;">
                      Studio · Ticket digital
                    </div>
                  </td>
                </tr>
                ${dottedDivider()}
                ${ticketRow("Orden", `#${data.orderShortId}`)}
                ${ticketRow("Fecha", formatDateTime(data.createdAt))}
                ${ticketRow("Estado", "Pagado")}
                ${dottedDivider()}

                <!-- Header productos -->
                <tr>
                  <td style="padding:0 0 8px;font-family:${MONO_FONT};font-size:10px;color:#a0a0a0;text-transform:uppercase;letter-spacing:0.2em;">
                    Producto
                  </td>
                  <td style="padding:0 0 8px;font-family:${MONO_FONT};font-size:10px;color:#a0a0a0;text-transform:uppercase;letter-spacing:0.2em;text-align:right;">
                    Importe
                  </td>
                </tr>
                ${itemsRows}
                ${dottedDivider()}
                ${totalsRows.join("")}
                ${solidDivider()}

                <!-- Total -->
                <tr>
                  <td style="padding:6px 0;font-family:${MONO_FONT};font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.16em;color:#0a0a0a;">
                    Total
                  </td>
                  <td style="padding:6px 0;font-family:${MONO_FONT};font-size:16px;font-weight:700;color:#0a0a0a;text-align:right;">
                    ${formatPrice(data.total)}
                  </td>
                </tr>

                ${dottedDivider()}
                ${ticketRow("Entrega", deliveryLabel)}
                ${addressBlock}
                ${dottedDivider()}

                <!-- Footer ticket -->
                <tr>
                  <td colspan="2" style="text-align:center;font-family:${MONO_FONT};font-size:10px;letter-spacing:0.3em;color:#8a8a8a;text-transform:uppercase;padding-top:4px;">
                    Gracias por tu compra
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="text-align:center;font-family:${MONO_FONT};font-size:10px;letter-spacing:0.2em;color:#b0b0b0;text-transform:uppercase;padding-top:4px;">
                    Te esperamos pronto
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Borde dentado (recibo) -->
          <tr>
            <td style="line-height:0;font-size:0;">
              <div style="height:14px;background-color:#f4f0e8;background-image:url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22480%22%20height%3D%2214%22%20viewBox%3D%220%200%20480%2014%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M0%200h480v7L470%2014%20460%207%20450%2014%20440%207%20430%2014%20420%207%20410%2014%20400%207%20390%2014%20380%207%20370%2014%20360%207%20350%2014%20340%207%20330%2014%20320%207%20310%2014%20300%207%20290%2014%20280%207%20270%2014%20260%207%20250%2014%20240%207%20230%2014%20220%207%20210%2014%20200%207%20190%2014%20180%207%20170%2014%20160%207%20150%2014%20140%207%20130%2014%20120%207%20110%2014%20100%207%2090%2014%2080%207%2070%2014%2060%207%2050%2014%2040%207%2030%2014%2020%207%2010%2014%200%207V0z%22%2F%3E%3C%2Fsvg%3E');background-repeat:no-repeat;background-size:100% 100%;">&nbsp;</div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://lizcabriales.com"}/perfil/pedidos"
                style="display:inline-block;padding:12px 26px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#0a0a0a;background-color:#C9A84C;text-decoration:none;border-radius:999px;">
                Ver mis pedidos
              </a>
            </td>
          </tr>

          <!-- Soporte -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;font-size:13px;color:#5a5a5a;line-height:1.6;">
              ¿Dudas? Escríbenos por WhatsApp al
              <a href="https://wa.me/528332183399" style="color:#C9A84C;font-weight:600;text-decoration:none;">
                833 218 3399
              </a>.
            </td>
          </tr>

          <!-- Footer brand -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;font-size:11px;color:#9b8b65;">
              © 2026 Liz Cabriales · Tampico, Tamaulipas
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
