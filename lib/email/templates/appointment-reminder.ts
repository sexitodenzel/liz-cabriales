import { getAppointmentWithDetails } from "@/lib/supabase/appointments"

import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  formatDateES,
  formatTimeES,
  getResend,
  renderAppointmentInfoBlock,
} from "./_shared"

export type AppointmentReminderData = {
  appointmentId: string
  customerFirstName: string
  services: Array<{ name: string; durationMin: number }>
  professionalName: string
  date: string
  startTime: string
  total: number
  manageUrl: string
}

export function buildAppointmentReminderHtml(
  data: AppointmentReminderData
): string {
  const infoBlock = renderAppointmentInfoBlock({
    services: data.services,
    professionalName: data.professionalName,
    date: data.date,
    startTime: data.startTime,
    total: data.total,
    referenceId: data.appointmentId,
  })

  const body = `
    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Hola, ${data.customerFirstName}
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: ${BRAND_BLACK}; line-height: 1.5;">
      Te recordamos que tienes cita mañana <strong>${formatDateES(data.date)}</strong>
      a las <strong>${formatTimeES(data.startTime)}</strong> en Academia Liz Cabriales.
    </p>

    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Detalles de la cita
    </p>
    ${infoBlock}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${data.manageUrl}"
            style="display: inline-block; padding: 12px 24px; background-color: ${BRAND_BLACK}; color: ${BRAND_GOLD}; font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; border-radius: 10px;">
            Gestionar o cancelar cita
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
      Si necesitas cambiar o cancelar, hazlo con al menos 24 horas de anticipación.
    </p>
  `

  return buildEmailShell({
    preheader: `Recordatorio: tu cita es mañana a las ${formatTimeES(data.startTime)}`,
    title: "Recordatorio de cita",
    badge: {
      label: "Recordatorio",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })
}

export async function sendAppointmentReminderEmail(
  appointmentId: string
): Promise<void> {
  const detailsRes = await getAppointmentWithDetails(appointmentId)
  if (!detailsRes.data) {
    throw new Error(
      `[email] No se pudieron obtener los datos de la cita ${appointmentId}: ${detailsRes.error.message}`
    )
  }
  const appt = detailsRes.data

  if (!appt.client_email) {
    throw new Error(
      `[email] Cita ${appointmentId} sin email de cliente asociado`
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const templateData: AppointmentReminderData = {
    appointmentId: appt.id,
    customerFirstName: appt.client_first_name ?? "cliente",
    services: appt.services.map((s) => ({
      name: s.service_name,
      durationMin: s.duration_min,
    })),
    professionalName: appt.professional_name ?? "Nuestro equipo",
    date: appt.date,
    startTime: appt.start_time,
    total: appt.total,
    manageUrl: `${appUrl}/cita/${appt.id}`,
  }

  const html = buildAppointmentReminderHtml(templateData)
  const subject = "Recordatorio: tienes una cita mañana"
  const recipientName = [appt.client_first_name, appt.client_last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName
      ? [`${recipientName} <${appt.client_email}>`]
      : [appt.client_email],
    subject,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend retornó error para el recordatorio de cita ${appointmentId}: ${JSON.stringify(error)}`
    )
  }
}
