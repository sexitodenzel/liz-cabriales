import {
  ADMIN_EMAIL,
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  getResend,
} from "./_shared"
import { formatLoginMethod } from "@/lib/supabase/login-events-shared"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatDateTimeMexico(iso = new Date().toISOString()): {
  date: string
  time: string
} {
  const d = new Date(iso)
  return {
    date: new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d),
    time: new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d),
  }
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 6px 0; font-size: 13px; color: #555; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `
}

async function sendToAdmins(subject: string, html: string, extraTo?: string[]): Promise<void> {
  if (!ADMIN_EMAIL && (!extraTo || extraTo.length === 0)) {
    console.warn("[email/security] ADMIN_EMAIL no configurado; se omite el aviso.")
    return
  }

  const to = Array.from(
    new Set([ADMIN_EMAIL, ...(extraTo ?? [])].filter((v): v is string => Boolean(v?.trim())))
  )
  if (to.length === 0) return

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  })
  if (error) {
    throw new Error(`[email/security] Resend error: ${JSON.stringify(error)}`)
  }
}

export type AdminLoginAlertData = {
  fullName?: string | null
  email: string
  method: string
  ip?: string | null
  userAgent?: string | null
  at?: string
}

/** 1) Aviso: un administrador inició sesión. */
export async function sendAdminLoginAlertEmail(
  data: AdminLoginAlertData
): Promise<void> {
  const { date, time } = formatDateTimeMexico(data.at)
  const name = data.fullName?.trim() || "Administrador"

  const body = `
    <p style="margin: 0 0 16px; font-size: 15px; color: ${BRAND_BLACK}; line-height: 1.5;">
      Se registró un inicio de sesión en el panel de administración.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 1px solid #e8e1d3; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${row("Nombre", name)}
            ${row("Correo", data.email)}
            ${row("Fecha", date)}
            ${row("Hora", `${time} (CDMX)`)}
            ${row("Método", formatLoginMethod(data.method))}
            ${row("IP", data.ip || "—")}
            ${row("Dispositivo", (data.userAgent || "—").slice(0, 120))}
          </table>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6;">
      Si no reconoces este acceso, cambia la contraseña y revisa la pestaña
      <strong>Accesos</strong> del panel.
    </p>
  `

  const html = buildEmailShell({
    preheader: `Acceso admin: ${name}`,
    title: "Nuevo acceso al panel",
    badge: {
      label: "Seguridad",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })

  await sendToAdmins(
    `[Seguridad] Acceso admin: ${name}`,
    html,
    [data.email]
  )
}

export type LoginBruteforceAlertData = {
  emailAttempted?: string | null
  ip: string
  userAgent?: string | null
  attemptCount: number
  kind: "failed_attempts" | "rate_limited"
  at?: string
}

/** 3) Aviso: intentos fallidos repetidos o rate limit en login. */
export async function sendLoginBruteforceAlertEmail(
  data: LoginBruteforceAlertData
): Promise<void> {
  const { date, time } = formatDateTimeMexico(data.at)
  const title =
    data.kind === "rate_limited"
      ? "Login bloqueado por demasiados intentos"
      : "Intentos fallidos de inicio de sesión"

  const body = `
    <p style="margin: 0 0 16px; font-size: 15px; color: ${BRAND_BLACK}; line-height: 1.5;">
      ${
        data.kind === "rate_limited"
          ? "Se alcanzó el límite de intentos de login y las peticiones quedaron bloqueadas temporalmente (HTTP 429)."
          : "Se detectaron varios intentos fallidos de inicio de sesión en poco tiempo."
      }
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 1px solid #e8e1d3; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${row("Fecha", date)}
            ${row("Hora", `${time} (CDMX)`)}
            ${row("IP", data.ip)}
            ${row("Correo intentado", data.emailAttempted?.trim() || "—")}
            ${row("Intentos en ventana", String(data.attemptCount))}
            ${row("Dispositivo", (data.userAgent || "—").slice(0, 120))}
          </table>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6;">
      Revisa si fue un error legítimo o un ataque. Si se repite, considera
      cambiar contraseñas de admin y revisar Accesos.
    </p>
  `

  const html = buildEmailShell({
    preheader: title,
    title,
    badge: {
      label: "Alerta",
      color: "#b45309",
      background: "#fff7ed",
      border: "#fdba74",
    },
    bodyHtml: body,
  })

  await sendToAdmins(`[Seguridad] ${title}`, html)
}
