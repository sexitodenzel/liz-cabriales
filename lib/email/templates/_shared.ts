import { Resend } from "resend"
import { createClient as createServiceClient } from "@supabase/supabase-js"

/**
 * Helpers y clientes compartidos entre los distintos templates de email.
 * Centralizar aquí evita duplicar el singleton de Resend/Supabase en cada file.
 */

let _resend: Resend | null = null
export function getResend(): Resend {
  if (_resend) return _resend
  _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

let _supabaseAdmin: ReturnType<typeof createServiceClient> | null = null
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin
  _supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return _supabaseAdmin
}

export const EMAIL_FROM = "Academia Liz Cabriales <notificaciones@lizcabriales.com>"
export const BRAND_GOLD = "#c6a75e"
export const BRAND_BLACK = "#0a0a0a"
export const BRAND_ORANGE = "#d97706"
/**
 * Destinatarios de los correos internos. `ADMIN_EMAIL` acepta varios separados
 * por coma (p. ej. la academia y el dev) para poder seguir los avisos sin
 * depender de un reenvío en Gmail.
 */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAIL ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean)

/** Primer destinatario; se conserva para los usos que esperan uno solo. */
export const ADMIN_EMAIL = ADMIN_EMAILS[0] ?? ""

/**
 * Paleta neutra "Apple-clean" para los correos.
 * Superficies grises neutras (no beige cálido) + dorado solo de acento,
 * hairlines finísimas y jerarquía por peso/espacio, no por adornos.
 */
export const EMAIL_BG = "#f5f5f5" // fondo de página neutro (el elegido)
export const EMAIL_SURFACE = "#ffffff" // tarjeta/cuerpo
export const EMAIL_HAIRLINE = "#ececec" // líneas divisorias finas
export const EMAIL_TEXT = "#1a1a1a" // texto principal
export const EMAIL_TEXT_SOFT = "#6b6b6b" // texto secundario
export const EMAIL_TEXT_MUTED = "#9a9a9a" // metadatos / footer
// Stack de sistema Apple: San Francisco en iPhone/Mac, degrada limpio en el resto.
export const EMAIL_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export const SALON_ADDRESS = "Nayarit #204-B, C. Durango Esquina, Unidad Nacional, Cd. Madero, Tamaulipas"
export const SALON_WHATSAPP = "833 218 3399"

export function formatPriceMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDateES(dateStr: string): string {
  // dateStr YYYY-MM-DD
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const str = dt.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatTimeES(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

/**
 * Botón estándar de los correos: blanco con borde negro por defecto,
 * se invierte a negro con texto blanco en hover (donde el cliente lo soporte).
 * El hover vive en EMAIL_BUTTON_STYLE_TAG (va en el <head>); el estado por
 * defecto es inline para que se vea bien en clientes que ignoran <style>.
 */
export const EMAIL_BUTTON_STYLE_TAG = `<style>
    .lc-btn { transition: opacity .15s ease; }
    .lc-btn:hover { opacity: 0.85 !important; }
  </style>`

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" class="lc-btn" style="display:inline-block;padding:13px 32px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;background-color:${BRAND_BLACK};border:1.5px solid ${BRAND_BLACK};text-decoration:none;border-radius:999px;">${label}</a>`
}

type ShellBadge = {
  label: string
  color: string
  background: string
  border: string
}

type ShellOptions = {
  preheader: string
  title: string
  badge: ShellBadge
  bodyHtml: string
}

/**
 * Wrapper HTML común a todos los emails transaccionales de citas y cursos.
 * Igual patrón visual que order-confirmation.ts (header negro + acento dorado).
 */
export function buildEmailShell(opts: ShellOptions): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  ${EMAIL_BUTTON_STYLE_TAG}
</head>
<body style="margin: 0; padding: 0; background-color: ${EMAIL_BG}; font-family: ${EMAIL_FONT}; -webkit-font-smoothing: antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${opts.preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${EMAIL_BG}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px;">

          <tr>
            <td style="background-color: ${EMAIL_SURFACE}; border: 1px solid ${EMAIL_HAIRLINE}; border-bottom: none; border-radius: 18px 18px 0 0; padding: 38px 40px 30px; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: ${BRAND_GOLD};">
                Academia Liz Cabriales
              </p>
              <p style="margin: 14px 0 0; font-size: 26px; font-weight: 600; color: ${EMAIL_TEXT}; letter-spacing: -0.015em; line-height: 1.12;">
                ${opts.title}
              </p>
              <p style="margin: 18px 0 0;">
                <span style="display: inline-block; padding: 6px 13px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #ffffff; background-color: ${BRAND_BLACK}; border: 1px solid ${BRAND_BLACK}; border-radius: 999px;">
                  ${opts.badge.label}
                </span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: ${EMAIL_SURFACE}; padding: 20px 40px 36px; border-left: 1px solid ${EMAIL_HAIRLINE}; border-right: 1px solid ${EMAIL_HAIRLINE};">
              ${opts.bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="background-color: ${EMAIL_SURFACE}; border: 1px solid ${EMAIL_HAIRLINE}; border-top: none; border-radius: 0 0 18px 18px; padding: 24px 40px 28px; text-align: center;">
              <div style="border-top: 1px solid ${EMAIL_HAIRLINE}; height: 1px; line-height: 1px; font-size: 0; margin-bottom: 20px;">&nbsp;</div>
              <p style="margin: 0; font-size: 12px; color: ${EMAIL_TEXT_MUTED}; letter-spacing: 0.01em;">
                Academia Liz Cabriales · Tampico, Tamaulipas
              </p>
              <p style="margin: 6px 0 0; font-size: 12px; color: ${EMAIL_TEXT_MUTED};">
                WhatsApp:
                <a href="https://wa.me/528332183399" style="color: ${BRAND_GOLD}; font-weight: 600; text-decoration: none;">
                  ${SALON_WHATSAPP}
                </a>
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

/**
 * Bloque tabular reutilizable "Datos de la cita" — servicios / profesional / fecha / hora / total.
 */
export function renderAppointmentInfoBlock(opts: {
  services: Array<{ name: string; durationMin: number }>
  professionalName: string
  date: string
  startTime: string
  total: number
  referenceId: string
}): string {
  const servicesLabel = opts.services
    .map((s) => `${s.name} (${s.durationMin} min)`)
    .join(" · ")

  const infoRow = (label: string, value: string, opts?: { mono?: boolean }) => `
            <tr>
              <td style="padding: 9px 0; font-size: 13px; color: ${EMAIL_TEXT_SOFT}; vertical-align: top; border-bottom: 1px solid ${EMAIL_HAIRLINE};">${label}</td>
              <td style="padding: 9px 0; font-size: 13px; color: ${EMAIL_TEXT}; font-weight: 600; text-align: right; vertical-align: top; border-bottom: 1px solid ${EMAIL_HAIRLINE};${opts?.mono ? " letter-spacing: 0.06em;" : ""}">
                ${value}
              </td>
            </tr>`

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 1px solid ${EMAIL_HAIRLINE}; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 6px 22px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${infoRow("Servicio(s)", servicesLabel)}
            ${infoRow("Profesional", opts.professionalName)}
            ${infoRow("Fecha", formatDateES(opts.date))}
            ${infoRow("Hora", formatTimeES(opts.startTime))}
            ${infoRow("Ubicación", SALON_ADDRESS)}
            <tr>
              <td style="padding: 9px 0; font-size: 13px; color: ${EMAIL_TEXT_SOFT};">Referencia</td>
              <td style="padding: 9px 0; font-size: 13px; color: ${EMAIL_TEXT}; font-weight: 700; letter-spacing: 0.08em; text-align: right;">
                #${shortId(opts.referenceId)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color: ${BRAND_BLACK}; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #b8b8b8;">
                Total pagado
              </td>
              <td style="font-size: 19px; font-weight: 600; color: ${BRAND_GOLD}; text-align: right; letter-spacing: -0.01em;">
                ${formatPriceMXN(opts.total)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}
