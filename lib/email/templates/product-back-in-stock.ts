import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  getResend,
} from "./_shared"

export type ProductBackInStockData = {
  firstName: string
  email: string
  productName: string
  variantName: string | null
  productUrl: string
}

function displayProductName(data: ProductBackInStockData): string {
  if (data.variantName && data.variantName.trim().length > 0) {
    return `${data.productName} — ${data.variantName}`
  }
  return data.productName
}

export function buildProductBackInStockHtml(data: ProductBackInStockData): string {
  const productLabel = displayProductName(data)

  const body = `
    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Hola, ${data.firstName}
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: ${BRAND_BLACK}; line-height: 1.5;">
      ¡Buenas noticias! Ya tenemos disponible el producto que estabas esperando.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px; background: #faf8f3; border: 1px solid #ead8a2; border-radius: 12px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8b65;">
            Producto disponible
          </p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${BRAND_BLACK}; line-height: 1.5;">
            ${productLabel}
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${data.productUrl}"
            style="display: inline-block; padding: 12px 24px; background-color: ${BRAND_BLACK}; color: ${BRAND_GOLD}; font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; border-radius: 10px;">
            Ver en la tienda
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
      El inventario puede agotarse pronto. Si te interesa, te recomendamos comprarlo cuanto antes.
    </p>
  `

  return buildEmailShell({
    preheader: `${productLabel} ya está disponible en la tienda`,
    title: "Producto disponible",
    badge: {
      label: "De vuelta en stock",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })
}

export async function sendProductBackInStockEmail(
  data: ProductBackInStockData
): Promise<void> {
  const productLabel = displayProductName(data)
  const html = buildProductBackInStockHtml(data)
  const subject = `¡Ya tenemos ${productLabel} disponible!`

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [`${data.firstName} <${data.email}>`],
    subject,
    html,
  })

  if (error) {
    console.error(
      `[email] Resend retornó error enviando alerta de stock a ${data.email}: ${JSON.stringify(error)}`
    )
  }
}
