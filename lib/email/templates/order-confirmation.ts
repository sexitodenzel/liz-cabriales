export type OrderConfirmationData = {
  customerFirstName: string
  customerLastName: string
  orderShortId: string
  items: Array<{
    productName: string
    variantName: string
    quantity: number
    unitPrice: number
  }>
  total: number
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

function renderItemRow(item: OrderConfirmationData["items"][number]): string {
  const displayName =
    item.variantName && item.variantName !== item.productName
      ? `${item.productName} — ${item.variantName}`
      : item.productName

  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0ece3; font-size: 14px; color: #333; line-height: 1.5;">
        ${displayName}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0ece3; font-size: 14px; color: #555; text-align: center; white-space: nowrap;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0ece3; font-size: 14px; color: #555; text-align: right; white-space: nowrap;">
        ${formatPrice(item.unitPrice)}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0ece3; font-size: 14px; font-weight: 600; color: #0a0a0a; text-align: right; white-space: nowrap;">
        ${formatPrice(item.quantity * item.unitPrice)}
      </td>
    </tr>`
}

function renderDeliverySection(data: OrderConfirmationData): string {
  if (data.deliveryType === "pickup") {
    return `
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #555;">Método de entrega</td>
        <td style="padding: 6px 0; font-size: 14px; color: #0a0a0a; font-weight: 600; text-align: right;">
          Retiro en local — Tampico, Tamaulipas
        </td>
      </tr>`
  }

  const addressLine = [
    data.shippingAddress,
    data.shippingCity && data.shippingState
      ? `${data.shippingCity}, ${data.shippingState}`
      : data.shippingCity ?? data.shippingState,
  ]
    .filter(Boolean)
    .join("<br>")

  return `
    <tr>
      <td style="padding: 6px 0; font-size: 14px; color: #555; vertical-align: top;">Dirección de envío</td>
      <td style="padding: 6px 0; font-size: 14px; color: #0a0a0a; font-weight: 600; text-align: right; line-height: 1.6;">
        ${addressLine}
      </td>
    </tr>`
}

export function buildOrderConfirmationHtml(
  data: OrderConfirmationData
): string {
  const itemRows = data.items.map(renderItemRow).join("")
  const deliveryRow = renderDeliverySection(data)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pedido — Liz Cabriales</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f6f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8f6f1; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px;">

          <!-- Header -->
          <tr>
            <td style="background-color: #0a0a0a; border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #C9A84C;">
                Liz Cabriales
              </p>
              <p style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.02em;">
                ¡Pago confirmado!
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e8e1d3; border-right: 1px solid #e8e1d3;">

              <!-- Saludo -->
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
                Hola, ${data.customerFirstName}
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #0a0a0a; line-height: 1.5;">
                Recibimos tu pago y estamos preparando tu pedido.
              </p>

              <!-- Número de orden -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: #fff8e7; border: 1px solid #ead8a2; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b7a1f;">
                      Número de orden
                    </p>
                    <p style="margin: 6px 0 0; font-size: 20px; font-weight: 700; color: #0a0a0a; letter-spacing: 0.06em;">
                      #${data.orderShortId}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Productos -->
              <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
                Productos
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="padding: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa; text-align: left; border-bottom: 2px solid #f0ece3;">
                      Producto
                    </th>
                    <th style="padding: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa; text-align: center; border-bottom: 2px solid #f0ece3; white-space: nowrap;">
                      Cant.
                    </th>
                    <th style="padding: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa; text-align: right; border-bottom: 2px solid #f0ece3; white-space: nowrap;">
                      Precio
                    </th>
                    <th style="padding: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa; text-align: right; border-bottom: 2px solid #f0ece3; white-space: nowrap;">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: #0a0a0a; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff;">
                          Total pagado
                        </td>
                        <td style="font-size: 20px; font-weight: 700; color: #C9A84C; text-align: right;">
                          ${formatPrice(data.total)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Entrega -->
              <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
                Entrega
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="border: 1px solid #e8e1d3; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      ${deliveryRow}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Cierre -->
              <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
                Nos pondremos en contacto contigo cuando tu pedido sea enviado.
                Cualquier duda escríbenos al
                <a href="https://wa.me/528332183399" style="color: #C9A84C; font-weight: 600; text-decoration: none;">
                  833 218 3399
                </a>.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f0e8; border: 1px solid #e8e1d3; border-top: none; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9b8b65;">
                © 2026 Liz Cabriales · Tampico, Tamaulipas · México
              </p>
              <p style="margin: 6px 0 0; font-size: 12px; color: #bbb;">
                Este correo fue enviado porque realizaste una compra en nuestra tienda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
