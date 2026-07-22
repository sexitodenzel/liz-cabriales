import { buildWhatsAppHref } from "@/lib/constants/contact"

export type AppointmentWhatsAppDetails = {
  dateLabel: string
  timeLabel: string
  professionalName?: string | null
  services: Array<{
    name: string
    options?: string[]
    price?: number | null
    durationMin?: number | null
  }>
  total?: number | null
  clientPhone?: string | null
  formatPrice?: (v: number) => string
}

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "")
  if (d.length === 10) {
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  }
  return digits
}

/** Mensaje con el detalle completo de la cita para enviar por WhatsApp. */
export function buildAppointmentBookingMessage(
  details: AppointmentWhatsAppDetails
): string {
  const lines: string[] = [
    "Hola, quiero confirmar mi cita en Liz Cabriales Studio.",
    "",
    `Fecha: ${details.dateLabel}`,
    `Hora: ${details.timeLabel}`,
  ]

  if (details.professionalName?.trim()) {
    lines.push(`Profesional: ${details.professionalName.trim()}`)
  }

  if (details.clientPhone?.trim()) {
    lines.push(`Celular: ${formatPhoneDisplay(details.clientPhone.trim())}`)
  }

  lines.push("", "Servicios:")
  for (const service of details.services) {
    const bits: string[] = [service.name]
    if (service.options && service.options.length > 0) {
      bits.push(`(${service.options.join(", ")})`)
    }
    const meta: string[] = []
    if (
      service.durationMin != null &&
      Number.isFinite(service.durationMin) &&
      service.durationMin > 0
    ) {
      meta.push(`${service.durationMin} min`)
    }
    if (
      service.price != null &&
      Number.isFinite(service.price) &&
      details.formatPrice
    ) {
      meta.push(details.formatPrice(service.price))
    }
    lines.push(
      meta.length > 0 ? `• ${bits.join(" ")} — ${meta.join(" · ")}` : `• ${bits.join(" ")}`
    )
  }

  if (
    details.total != null &&
    Number.isFinite(details.total) &&
    details.formatPrice
  ) {
    lines.push("", `Total: ${details.formatPrice(details.total)}`)
  }

  return lines.join("\n")
}

export function buildAppointmentWhatsAppHref(
  details: AppointmentWhatsAppDetails
): string {
  return buildWhatsAppHref(buildAppointmentBookingMessage(details))
}
