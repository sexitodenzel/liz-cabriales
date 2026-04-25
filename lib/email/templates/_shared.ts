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

export const EMAIL_FROM = "Academia Liz Cabriales <onboarding@resend.dev>"
export const BRAND_GOLD = "#C9A84C"
export const BRAND_BLACK = "#0a0a0a"
export const BRAND_ORANGE = "#d97706"
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
</head>
<body style="margin: 0; padding: 0; background-color: #f8f6f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${opts.preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8f6f1; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px;">

          <tr>
            <td style="background-color: ${BRAND_BLACK}; border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${BRAND_GOLD};">
                Academia Liz Cabriales
              </p>
              <p style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.02em;">
                ${opts.title}
              </p>
              <p style="margin: 14px 0 0;">
                <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${opts.badge.color}; background-color: ${opts.badge.background}; border: 1px solid ${opts.badge.border}; border-radius: 999px;">
                  ${opts.badge.label}
                </span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e8e1d3; border-right: 1px solid #e8e1d3;">
              ${opts.bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="background-color: #f4f0e8; border: 1px solid #e8e1d3; border-top: none; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9b8b65;">
                Academia Liz Cabriales · Tampico, Tamaulipas
              </p>
              <p style="margin: 6px 0 0; font-size: 12px; color: #9b8b65;">
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

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 1px solid #e8e1d3; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555; vertical-align: top;">Servicio(s)</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${servicesLabel}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Profesional</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${opts.professionalName}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Fecha</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${formatDateES(opts.date)}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Hora</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${formatTimeES(opts.startTime)}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Ubicación</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${SALON_ADDRESS}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Referencia</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 700; letter-spacing: 0.08em; text-align: right;">
                #${shortId(opts.referenceId)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color: ${BRAND_BLACK}; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff;">
                Total pagado
              </td>
              <td style="font-size: 18px; font-weight: 700; color: ${BRAND_GOLD}; text-align: right;">
                ${formatPriceMXN(opts.total)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}
