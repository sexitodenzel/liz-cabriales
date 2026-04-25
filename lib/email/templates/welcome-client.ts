import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  getResend,
} from "./_shared"

export type WelcomeClientData = {
  firstName: string
  email: string
  appUrl: string
}

export function buildWelcomeClientHtml(data: WelcomeClientData): string {
  const loginUrl = `${data.appUrl.replace(/\/$/, "")}/login`

  const body = `
    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Hola, ${data.firstName}
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: ${BRAND_BLACK}; line-height: 1.5;">
      Tu cuenta en Academia Liz Cabriales ya está lista.
    </p>

    <p style="margin: 0 0 24px; font-size: 14px; color: #555; line-height: 1.7;">
      Para establecer tu contraseña, entra a nuestro sitio y usa la opción
      <strong>“Olvidé mi contraseña”</strong> con este correo:
      <a href="mailto:${data.email}" style="color: ${BRAND_GOLD}; font-weight: 600; text-decoration: none;">${data.email}</a>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${loginUrl}"
            style="display: inline-block; padding: 12px 24px; background-color: ${BRAND_BLACK}; color: ${BRAND_GOLD}; font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; border-radius: 10px;">
            Ir al sitio
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
      Desde tu cuenta podrás ver y gestionar tus citas e inscripciones a cursos.
    </p>
  `

  return buildEmailShell({
    preheader: "Tu cuenta en Academia Liz Cabriales ya está lista",
    title: "Bienvenida a la Academia",
    badge: {
      label: "Cuenta creada",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })
}

export async function sendWelcomeClientEmail(
  data: WelcomeClientData
): Promise<void> {
  const html = buildWelcomeClientHtml(data)
  const subject = "Tu cuenta en Academia Liz Cabriales está lista"

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [`${data.firstName} <${data.email}>`],
    subject,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend retornó error enviando bienvenida a ${data.email}: ${JSON.stringify(error)}`
    )
  }
}
