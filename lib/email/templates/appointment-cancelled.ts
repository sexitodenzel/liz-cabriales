import { getAppointmentWithDetails } from "@/lib/supabase/appointments"
import { sendAdminAppointmentCancelledEmail } from "@/lib/email/admin"

import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  SALON_WHATSAPP,
  buildEmailShell,
  formatDateES,
  formatTimeES,
  getResend,
  shortId,
} from "./_shared"

// ─── Email al cliente cuando él mismo cancela ────────────────────────────────

export async function sendAppointmentCancelledByClientEmail(
  appointmentId: string
): Promise<void> {
  const res = await getAppointmentWithDetails(appointmentId)
  if (!res.data) {
    throw new Error(
      `[email] No se pudieron obtener datos de la cita ${appointmentId}: ${res.error.message}`
    )
  }
  const appt = res.data

  if (!appt.client_email) {
    throw new Error(
      `[email] Cita ${appointmentId} sin email de cliente`
    )
  }

  const recipientName = [appt.client_first_name, appt.client_last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">
      Hola, ${appt.client_first_name ?? "cliente"}
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND_BLACK};line-height:1.5;">
      Confirmamos que tu cita fue cancelada correctamente.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Referencia</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(appt.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Fecha</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;text-decoration:line-through;">${formatDateES(appt.date)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Hora</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;text-decoration:line-through;">${formatTimeES(appt.start_time)}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      Si deseas reagendar, escríbenos por WhatsApp al
      <a href="https://wa.me/528332183399" style="color:${BRAND_GOLD};font-weight:600;text-decoration:none;">${SALON_WHATSAPP}</a>.
    </p>
  `

  const html = buildEmailShell({
    preheader: `Tu cita del ${formatDateES(appt.date)} fue cancelada`,
    title: "Cita cancelada",
    badge: {
      label: "Cancelada",
      color: "#dc2626",
      background: "#fef2f2",
      border: "#fecaca",
    },
    bodyHtml: body,
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName
      ? [`${recipientName} <${appt.client_email}>`]
      : [appt.client_email],
    subject: `Tu cita fue cancelada — #${shortId(appt.id)}`,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend error para cita cancelada ${appointmentId}: ${JSON.stringify(error)}`
    )
  }

  // Notificar al admin en fire-and-forget
  sendAdminAppointmentCancelledEmail(appointmentId).catch((err) =>
    console.error(
      `[email] Error enviando alerta admin por cancelación de cita ${appointmentId}:`,
      err
    )
  )
}

// ─── Email al cliente cuando el admin cancela su cita ────────────────────────

export async function sendAppointmentCancelledByAdminEmail(
  appointmentId: string
): Promise<void> {
  const res = await getAppointmentWithDetails(appointmentId)
  if (!res.data) {
    throw new Error(
      `[email] No se pudieron obtener datos de la cita ${appointmentId}: ${res.error.message}`
    )
  }
  const appt = res.data

  if (!appt.client_email) return

  const recipientName = [appt.client_first_name, appt.client_last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">
      Hola, ${appt.client_first_name ?? "cliente"}
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND_BLACK};line-height:1.5;">
      Lamentamos informarte que tu cita ha sido cancelada por la academia. Si tienes dudas o deseas reagendar, no dudes en contactarnos.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Referencia</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(appt.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Fecha</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;text-decoration:line-through;">${formatDateES(appt.date)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Hora</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;text-decoration:line-through;">${formatTimeES(appt.start_time)}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      Para reagendar escríbenos por WhatsApp al
      <a href="https://wa.me/528332183399" style="color:${BRAND_GOLD};font-weight:600;text-decoration:none;">${SALON_WHATSAPP}</a>.
      Disculpa los inconvenientes.
    </p>
  `

  const html = buildEmailShell({
    preheader: `Tu cita del ${formatDateES(appt.date)} fue cancelada`,
    title: "Cita cancelada",
    badge: {
      label: "Cancelada por la academia",
      color: "#dc2626",
      background: "#fef2f2",
      border: "#fecaca",
    },
    bodyHtml: body,
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName
      ? [`${recipientName} <${appt.client_email}>`]
      : [appt.client_email],
    subject: `Tu cita fue cancelada — #${shortId(appt.id)}`,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend error para cita cancelada-por-admin ${appointmentId}: ${JSON.stringify(error)}`
    )
  }
}
