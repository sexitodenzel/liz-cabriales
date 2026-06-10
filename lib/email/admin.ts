import { getAppointmentWithDetails } from "@/lib/supabase/appointments"
import { getRegistrationWithDetails } from "@/lib/supabase/courses"

import {
  ADMIN_EMAIL,
  BRAND_BLACK,
  BRAND_GOLD,
  EMAIL_FROM,
  buildEmailShell,
  formatDateES,
  formatPriceMXN,
  formatTimeES,
  getResend,
  getSupabaseAdmin,
  shortId,
} from "./templates/_shared"

function adminBadge() {
  return {
    label: "Notificación interna",
    color: "#ffffff",
    background: BRAND_BLACK,
    border: BRAND_BLACK,
  }
}

async function send(subject: string, html: string): Promise<void> {
  if (!ADMIN_EMAIL) return
  const resend = getResend()
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [ADMIN_EMAIL],
    subject,
    html,
  })
  if (error) {
    throw new Error(`[email/admin] Resend error: ${JSON.stringify(error)}`)
  }
}

// ─── Nueva orden ─────────────────────────────────────────────────────────────

type RawUser = { first_name: string; last_name: string; email: string }
type RawOrderItem = {
  quantity: number | string
  unit_price: number | string
  products: { name: string } | { name: string }[] | null
  product_variants: { variant_name: string } | { variant_name: string }[] | null
}
type RawOrderRow = {
  id: string
  total: number | string
  delivery_type: string
  status: string
  users: RawUser | RawUser[] | null
  order_items: RawOrderItem[] | null
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

export async function sendAdminNewOrderEmail(orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, total, delivery_type, status,
       users ( first_name, last_name, email ),
       order_items ( quantity, unit_price, products ( name ), product_variants ( variant_name ) )`
    )
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return

  const raw = data as unknown as RawOrderRow
  const user = unwrap(raw.users)
  const clientName = user ? `${user.first_name} ${user.last_name}` : "—"
  const clientEmail = user?.email ?? "—"

  const itemsRows = (raw.order_items ?? [])
    .map((item) => {
      const p = unwrap(item.products)
      const v = unwrap(item.product_variants)
      const label = [p?.name, v?.variant_name].filter(Boolean).join(" — ")
      return `<tr>
        <td style="padding:5px 0;font-size:13px;color:#555;">${label}</td>
        <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">
          ${Number(item.quantity)} × ${formatPriceMXN(Number(item.unit_price))}
        </td>
      </tr>`
    })
    .join("")

  const deliveryLabel =
    raw.delivery_type === "shipping" ? "Envío a domicilio" : "Recoger en tienda"

  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND_BLACK};line-height:1.5;">
      Nueva orden recibida. Revisar en el panel admin.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Referencia</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(raw.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Cliente</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Email</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${clientEmail}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Entrega</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${deliveryLabel}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9b8b65;">Productos</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${itemsRows}
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color:${BRAND_BLACK};border-radius:12px;">
      <tr><td style="padding:14px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#fff;">Total</td>
            <td style="font-size:18px;font-weight:700;color:${BRAND_GOLD};text-align:right;">${formatPriceMXN(Number(raw.total))}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  `

  const html = buildEmailShell({
    preheader: `Nueva orden #${shortId(raw.id)} — ${clientName}`,
    title: "Nueva orden recibida",
    badge: adminBadge(),
    bodyHtml: body,
  })

  await send(`[Admin] Nueva orden #${shortId(raw.id)} — ${clientName}`, html)
}

// ─── Nueva cita ───────────────────────────────────────────────────────────────

export async function sendAdminNewAppointmentEmail(
  appointmentId: string
): Promise<void> {
  const res = await getAppointmentWithDetails(appointmentId)
  if (!res.data) return

  const appt = res.data
  const clientName = [appt.client_first_name, appt.client_last_name]
    .filter(Boolean)
    .join(" ")
  const servicesLabel = appt.services
    .map((s) => `${s.service_name} (${s.duration_min} min)`)
    .join(" · ")

  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND_BLACK};line-height:1.5;">
      Nueva cita reservada y pagada.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Referencia</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(appt.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Cliente</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${clientName || "—"}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Email</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${appt.client_email || "—"}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Servicio(s)</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${servicesLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Profesional</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${appt.professional_name ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Fecha</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${formatDateES(appt.date)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Hora</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${formatTimeES(appt.start_time)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Total</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">${formatPriceMXN(appt.total)}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  `

  const html = buildEmailShell({
    preheader: `Nueva cita #${shortId(appt.id)} — ${clientName} — ${formatDateES(appt.date)}`,
    title: "Nueva cita reservada",
    badge: adminBadge(),
    bodyHtml: body,
  })

  await send(
    `[Admin] Nueva cita #${shortId(appt.id)} — ${clientName} · ${formatDateES(appt.date)}`,
    html
  )
}

// ─── Nueva inscripción a curso ────────────────────────────────────────────────

export async function sendAdminNewCourseRegistrationEmail(
  registrationId: string
): Promise<void> {
  const res = await getRegistrationWithDetails(registrationId)
  if (!res.data) return

  const reg = res.data
  if (!reg.course) return

  const clientName = [reg.client_first_name, reg.client_last_name]
    .filter(Boolean)
    .join(" ")
  const totalPrice = reg.course.price * reg.attendees
  const amountPaid =
    reg.approved_payment_amount != null
      ? reg.approved_payment_amount
      : totalPrice
  const isDeposit = amountPaid < totalPrice

  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND_BLACK};line-height:1.5;">
      Nueva inscripción recibida${isDeposit ? " (depósito parcial)" : ""}.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Referencia</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(reg.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Cliente</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${clientName || "—"}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Email</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${reg.client_email || "—"}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Curso</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${reg.course.title}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Asistentes</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${reg.attendees}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Pagado</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">${formatPriceMXN(amountPaid)}${isDeposit ? ` / ${formatPriceMXN(totalPrice)}` : ""}</td>
          </tr>
          ${isDeposit ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#b45309;">Saldo pendiente</td>
            <td style="padding:5px 0;font-size:13px;color:#b45309;font-weight:700;text-align:right;">${formatPriceMXN(totalPrice - amountPaid)}</td>
          </tr>` : ""}
        </table>
      </td></tr>
    </table>
  `

  const html = buildEmailShell({
    preheader: `Nueva inscripción #${shortId(reg.id)} — ${clientName} — ${reg.course.title}`,
    title: "Nueva inscripción a curso",
    badge: adminBadge(),
    bodyHtml: body,
  })

  await send(
    `[Admin] Nueva inscripción #${shortId(reg.id)} — ${clientName} · ${reg.course.title}`,
    html
  )
}

// ─── Cita cancelada por el cliente ───────────────────────────────────────────

export async function sendAdminAppointmentCancelledEmail(
  appointmentId: string
): Promise<void> {
  const res = await getAppointmentWithDetails(appointmentId)
  if (!res.data) return

  const appt = res.data
  const clientName = [appt.client_first_name, appt.client_last_name]
    .filter(Boolean)
    .join(" ")

  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND_BLACK};line-height:1.5;">
      El cliente canceló su cita. El horario quedó disponible.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #e8e1d3;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Referencia</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:700;text-align:right;">#${shortId(appt.id)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Cliente</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${clientName || "—"}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Email</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${appt.client_email || "—"}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Fecha</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${formatDateES(appt.date)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Hora</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${formatTimeES(appt.start_time)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#555;">Profesional</td>
            <td style="padding:5px 0;font-size:13px;color:${BRAND_BLACK};font-weight:600;text-align:right;">${appt.professional_name ?? "—"}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  `

  const html = buildEmailShell({
    preheader: `Cita cancelada #${shortId(appt.id)} — ${clientName}`,
    title: "Cita cancelada por el cliente",
    badge: {
      label: "Cancelada",
      color: "#ffffff",
      background: "#dc2626",
      border: "#dc2626",
    },
    bodyHtml: body,
  })

  await send(
    `[Admin] Cita cancelada #${shortId(appt.id)} — ${clientName} · ${formatDateES(appt.date)}`,
    html
  )
}
