import { getAppointmentWithDetails } from "@/lib/supabase/appointments"
import { getRegistrationWithDetails } from "@/lib/supabase/courses"

import {
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  SALON_WHATSAPP,
  buildEmailShell,
  getResend,
  shortId,
} from "./_shared"

function buildPaymentFailedHtml(opts: {
  firstName: string
  referenceId: string
  entityLabel: string
}): string {
  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">
      Hola, ${opts.firstName}
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND_BLACK};line-height:1.5;">
      Tu pago para <strong>${opts.entityLabel}</strong> no pudo procesarse. No se realizó ningún cargo.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#dc2626;">
          Pago no procesado
        </p>
        <p style="margin:6px 0 0;font-size:13px;color:${BRAND_BLACK};line-height:1.5;">
          Referencia <strong>#${shortId(opts.referenceId)}</strong>. Puedes intentarlo de nuevo o contactarnos si el problema persiste.
        </p>
      </td></tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      ¿Necesitas ayuda? Escríbenos por WhatsApp al
      <a href="https://wa.me/528332183399" style="color:${BRAND_GOLD};font-weight:600;text-decoration:none;">${SALON_WHATSAPP}</a>.
    </p>
  `

  return buildEmailShell({
    preheader: "Tu pago no pudo procesarse — ningún cargo fue realizado",
    title: "Pago no procesado",
    badge: {
      label: "Pago fallido",
      color: "#dc2626",
      background: "#fef2f2",
      border: "#fecaca",
    },
    bodyHtml: body,
  })
}

export async function sendAppointmentPaymentFailedEmail(
  appointmentId: string
): Promise<void> {
  const res = await getAppointmentWithDetails(appointmentId)
  if (!res.data || !res.data.client_email) return

  const appt = res.data
  const recipientName = [appt.client_first_name, appt.client_last_name]
    .filter((v): v is string => Boolean(v))
    .join(" ")
    .trim()

  const html = buildPaymentFailedHtml({
    firstName: appt.client_first_name ?? "cliente",
    referenceId: appt.id,
    entityLabel: "tu cita",
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName
      ? [`${recipientName} <${appt.client_email!}>`]
      : [appt.client_email!],
    subject: `Pago no procesado — cita #${shortId(appt.id)}`,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend error pago fallido cita ${appointmentId}: ${JSON.stringify(error)}`
    )
  }
}

export async function sendCoursePaymentFailedEmail(
  registrationId: string
): Promise<void> {
  const res = await getRegistrationWithDetails(registrationId)
  if (!res.data || !res.data.client_email) return

  const reg = res.data
  const recipientName = [reg.client_first_name, reg.client_last_name]
    .filter((v): v is string => Boolean(v))
    .join(" ")
    .trim()

  const courseTitle = reg.course?.title ?? "el curso"

  const html = buildPaymentFailedHtml({
    firstName: reg.client_first_name ?? "cliente",
    referenceId: reg.id,
    entityLabel: courseTitle,
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientName
      ? [`${recipientName} <${reg.client_email!}>`]
      : [reg.client_email!],
    subject: `Pago no procesado — inscripción #${shortId(reg.id)}`,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend error pago fallido inscripción ${registrationId}: ${JSON.stringify(error)}`
    )
  }
}
