import { getRegistrationWithDetails } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"

import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  formatDateES,
  formatPriceMXN,
  formatTimeES,
  getResend,
  shortId,
} from "./_shared"

export type CourseRegistrationData = {
  registrationId: string
  customerFirstName: string
  courseTitle: string
  instructorName: string
  startDate: string
  endDate: string | null
  startTime: string
  location: string
  level: CourseLevel
  attendees: number
  amountPaid: number
  totalPrice: number
}

function levelLabel(level: CourseLevel): string {
  const map: Record<CourseLevel, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    open: "Todos los niveles",
  }
  return map[level] ?? level
}

function formatDateRange(start: string, end: string | null): string {
  if (!end || end === start) return formatDateES(start)
  return `Del ${formatDateES(start)} al ${formatDateES(end)}`
}

export function buildCourseRegistrationHtml(
  data: CourseRegistrationData
): string {
  const isDeposit = data.amountPaid < data.totalPrice
  const pendingBalance = Math.max(0, data.totalPrice - data.amountPaid)

  const paymentRow = isDeposit
    ? `
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #555;">Monto pagado</td>
          <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 700; text-align: right;">
            ${formatPriceMXN(data.amountPaid)}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #555;">Saldo pendiente</td>
          <td style="padding: 6px 0; font-size: 13px; color: #b45309; font-weight: 700; text-align: right;">
            ${formatPriceMXN(pendingBalance)}
          </td>
        </tr>
      `
    : `
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #555;">Pago completo</td>
          <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 700; text-align: right;">
            ${formatPriceMXN(data.amountPaid)}
          </td>
        </tr>
      `

  const body = `
    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Hola, ${data.customerFirstName}
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: ${BRAND_BLACK}; line-height: 1.5;">
      ¡Tu lugar en <strong>${data.courseTitle}</strong> está apartado! Gracias por confiar en la Academia.
    </p>

    <!-- Número de inscripción -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color: #fff8e7; border: 1px solid #ead8a2; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b7a1f;">
            Referencia
          </p>
          <p style="margin: 6px 0 0; font-size: 18px; font-weight: 700; color: ${BRAND_BLACK}; letter-spacing: 0.06em;">
            #${shortId(data.registrationId)}
          </p>
        </td>
      </tr>
    </table>

    <!-- Detalles del curso -->
    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Detalles del curso
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 1px solid #e8e1d3; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Curso</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 700; text-align: right;">
                ${data.courseTitle}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Instructor</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${data.instructorName}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Fecha(s)</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${formatDateRange(data.startDate, data.endDate)}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Hora</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${formatTimeES(data.startTime)}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Ubicación</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${data.location}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Nivel</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${levelLabel(data.level)}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #555;">Asistentes</td>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND_BLACK}; font-weight: 600; text-align: right;">
                ${data.attendees}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Pago -->
    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #9b8b65;">
      Pago
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border: 1px solid #e8e1d3; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${paymentRow}
          </table>
        </td>
      </tr>
    </table>

    ${
      isDeposit
        ? `<p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
             El saldo restante se liquida el primer día de clase. Cualquier duda escríbenos por WhatsApp.
           </p>`
        : `<p style="margin: 0; font-size: 14px; color: #555; line-height: 1.7;">
             Nos vemos pronto. Cualquier duda escríbenos por WhatsApp.
           </p>`
    }
  `

  return buildEmailShell({
    preheader: `Tu inscripción a ${data.courseTitle} está confirmada`,
    title: "¡Tu inscripción está confirmada!",
    badge: {
      label: "Inscripción confirmada",
      color: BRAND_GOLD,
      background: "#fff8e7",
      border: "#ead8a2",
    },
    bodyHtml: body,
  })
}

/**
 * Envía el email de inscripción al curso. Obtiene los datos completos
 * (curso, instructor, usuario, pago) a partir del registrationId.
 */
export async function sendCourseRegistrationEmail(
  registrationId: string
): Promise<void> {
  const detailsRes = await getRegistrationWithDetails(registrationId)
  if (!detailsRes.data) {
    throw new Error(
      `[email] No se pudieron obtener los datos de la inscripción ${registrationId}: ${detailsRes.error.message}`
    )
  }
  const reg = detailsRes.data

  if (!reg.course) {
    throw new Error(
      `[email] Inscripción ${registrationId} sin curso asociado`
    )
  }
  if (!reg.client_email) {
    throw new Error(
      `[email] Inscripción ${registrationId} sin email de cliente`
    )
  }

  const totalPrice = reg.course.price * reg.attendees
  const amountPaid =
    reg.approved_payment_amount != null
      ? reg.approved_payment_amount
      : totalPrice

  const templateData: CourseRegistrationData = {
    registrationId: reg.id,
    customerFirstName: reg.client_first_name ?? "cliente",
    courseTitle: reg.course.title,
    instructorName: reg.course.instructor?.name ?? "Instructor",
    startDate: reg.course.start_date,
    endDate: reg.course.end_date,
    startTime: reg.course.start_time,
    location: reg.course.location,
    level: reg.course.level,
    attendees: reg.attendees,
    amountPaid,
    totalPrice,
  }

  const html = buildCourseRegistrationHtml(templateData)
  const subject = `¡Tu inscripción está confirmada! — ${reg.course.title}`
  const recipientName = [reg.client_first_name, reg.client_last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName
      ? [`${recipientName} <${reg.client_email}>`]
      : [reg.client_email],
    subject,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend retornó error para la inscripción ${registrationId}: ${JSON.stringify(error)}`
    )
  }
}
