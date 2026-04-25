import { getAppointmentWithDetails } from "@/lib/supabase/appointments"

import {
  BRAND_BLACK,
  BRAND_GOLD,
  BRAND_ORANGE,
  EMAIL_FROM,
  SALON_ADDRESS,
  buildEmailShell,
  formatDateES,
  formatTimeES,
  getResend,
  shortId,
} from "./_shared"

export type AppointmentRescheduledData = {
  appointmentId: string
  customerFirstName: string
  services: Array<{ name: string; durationMin: number }>
  professionalName: string
  previousDate: string
  previousStartTime: string
  newDate: string
  newStartTime: string
  total: number
}

export function buildAppointmentRescheduledHtml(
  data: AppointmentRescheduledData
): string {
  const servicesLabel = data.services
    .map((s) => `${s.name} (${s.durationMin} min)`)
    .join(" · ")

  const body = `
    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Hola, ${data.customerFirstName}
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: ${BRAND_BLACK}; line-height: 1.5;">
      Tu cita ha sido actualizada. Aquí están los nuevos detalles:
    </p>

    <!-- Horario anterior -->
    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Horario anterior
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 1px solid #e8e1d3; border-radius: 12px; margin-bottom: 20px; background-color: #f9f7f1;">
      <tr>
        <td style="padding: 14px 20px;">
          <p style="margin: 0; font-size: 13px; color: #555; text-decoration: line-through;">
            ${formatDateES(data.previousDate)} · ${formatTimeES(data.previousStartTime)}
          </p>
        </td>
      </tr>
    </table>

    <!-- Horario nuevo -->
    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${BRAND_ORANGE};">
      Nuevo horario
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 2px solid ${BRAND_ORANGE}; border-radius: 12px; margin-bottom: 24px; background-color: #fff7ed;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #555;">Fecha</td>
              <td style="padding: 4px 0; font-size: 14px; color: ${BRAND_BLACK}; font-weight: 700; text-align: right;">
                ${formatDateES(data.newDate)}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #555;">Hora</td>
              <td style="padding: 4px 0; font-size: 14px; color: ${BRAND_BLACK}; font-weight: 700; text-align: right;">
                ${formatTimeES(data.newStartTime)}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #555;">Profesional</td>
              <td style="padding: 4px 0; font-size: 14px; color: ${BRAND_BLACK}; font-weight: 700; text-align: right;">
                ${data.professionalName}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #555; vertical-align: top;">Servicio(s)</td>
              <td style="padding: 4px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${servicesLabel}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #555;">Ubicación</td>
              <td style="padding: 4px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${SALON_ADDRESS}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
      Tu referencia de reserva sigue siendo
      <strong style="color: ${BRAND_GOLD};">#${shortId(data.appointmentId)}</strong>.
      Si este cambio no coincide con lo acordado, escríbenos por WhatsApp.
    </p>
  `

  return buildEmailShell({
    preheader: `Tu cita fue reprogramada al ${formatDateES(data.newDate)}`,
    title: "Tu cita fue reprogramada",
    badge: {
      label: "Reprogramada",
      color: "#ffffff",
      background: BRAND_ORANGE,
      border: BRAND_ORANGE,
    },
    bodyHtml: body,
  })
}

/**
 * Envía el email notificando que la cita fue reprogramada.
 * El llamador debe proveer la fecha/hora anterior (antes del UPDATE).
 */
export async function sendAppointmentRescheduledEmail(params: {
  appointmentId: string
  previousDate: string
  previousStartTime: string
}): Promise<void> {
  const detailsRes = await getAppointmentWithDetails(params.appointmentId)
  if (!detailsRes.data) {
    throw new Error(
      `[email] No se pudieron obtener los datos de la cita ${params.appointmentId}: ${detailsRes.error.message}`
    )
  }
  const appt = detailsRes.data

  if (!appt.client_email) {
    throw new Error(
      `[email] Cita ${params.appointmentId} sin email de cliente asociado`
    )
  }

  const templateData: AppointmentRescheduledData = {
    appointmentId: appt.id,
    customerFirstName: appt.client_first_name ?? "cliente",
    services: appt.services.map((s) => ({
      name: s.service_name,
      durationMin: s.duration_min,
    })),
    professionalName: appt.professional_name ?? "Nuestro equipo",
    previousDate: params.previousDate,
    previousStartTime: params.previousStartTime,
    newDate: appt.date,
    newStartTime: appt.start_time,
    total: appt.total,
  }

  const html = buildAppointmentRescheduledHtml(templateData)
  const subject = `Tu cita ha sido reprogramada — ${formatDateES(appt.date)}`
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
      `[email] Resend retornó error para la cita ${params.appointmentId} (reprogramada): ${JSON.stringify(error)}`
    )
  }
}
