import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  getResend,
} from "./_shared"

type PasswordResetSuccessData = {
  email: string
  firstName?: string | null
}

export function buildPasswordResetSuccessHtml(
  data: PasswordResetSuccessData
): string {
  const displayName = data.firstName?.trim() || "cliente"

  const body = `
    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Hola, ${displayName}
    </p>
    <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND_BLACK}; line-height: 1.5;">
      Tu contraseña fue restablecida correctamente.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color: #fff8e7; border: 1px solid #ead8a2; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 14px 20px;">
          <p style="margin: 0; font-size: 13px; color: #0a0a0a; line-height: 1.6;">
            Si tú no realizaste este cambio, contáctanos de inmediato por WhatsApp para ayudarte a proteger tu cuenta.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.7;">
      Correo de la cuenta: <strong>${data.email}</strong>
    </p>
  `

  return buildEmailShell({
    preheader: "Tu contraseña fue restablecida",
    title: "Cambio de contraseña",
    badge: {
      label: "Seguridad",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })
}

export async function sendPasswordResetSuccessEmail(
  data: PasswordResetSuccessData
): Promise<void> {
  const resend = getResend()
  const html = buildPasswordResetSuccessHtml(data)
  const subject = "Tu contraseña fue restablecida"

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: data.firstName
      ? [`${data.firstName} <${data.email}>`]
      : [data.email],
    subject,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend retornó error enviando confirmación de reset a ${data.email}: ${JSON.stringify(error)}`
    )
  }
}
