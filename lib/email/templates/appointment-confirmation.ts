import { getAppointmentWithDetails } from "@/lib/supabase/appointments"

import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  formatDateES,
  getResend,
  renderAppointmentInfoBlock,
  shortId,
} from "./_shared"

export type AppointmentConfirmationData = {
  appointmentId: string
  customerFirstName: string
  services: Array<{ name: string; durationMin: number }>
  professionalName: string
  date: string
  startTime: string
  total: number
}

export function buildAppointmentConfirmationHtml(
  data: AppointmentConfirmationData
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
      Tu cita quedó registrada y confirmada. Te esperamos con gusto.
    </p>

    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Detalles de la cita
    </p>
    ${infoBlock}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color: #fff8e7; border: 1px solid #ead8a2; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 20px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #9b7a1f;">
            Política de cancelación
          </p>
          <p style="margin: 6px 0 0; font-size: 13px; color: #0a0a0a; line-height: 1.5;">
            Puedes cancelar con al menos 24 horas de anticipación desde tu cuenta o escribiéndonos por WhatsApp.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
      Conserva este correo como comprobante. Tu referencia de reserva es
      <strong style="color: ${BRAND_GOLD};">#${shortId(data.appointmentId)}</strong>.
    </p>
  `

  return buildEmailShell({
    preheader: `Tu cita quedó confirmada para el ${formatDateES(data.date)}`,
    title: "Tu cita está confirmada",
    badge: {
      label: "Confirmada",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })
}

/**
 * Envía el email de confirmación de cita. Obtiene los datos completos
 * (servicios, profesional, cliente) a partir del appointmentId.
 */
export async function sendAppointmentConfirmationEmail(
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

  const templateData: AppointmentConfirmationData = {
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
  }

  const html = buildAppointmentConfirmationHtml(templateData)
  const subject = `Tu cita está confirmada — ${formatDateES(appt.date)}`
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
      `[email] Resend retornó error para la cita ${appointmentId}: ${JSON.stringify(error)}`
    )
  }
}
