/** Horas para completar el pago cuando la cita es con al menos 1 día de anticipo. */
export const PENDING_PAYMENT_HOURS = 4

/** Minutos para completar el pago cuando la cita es el mismo día. */
export const PENDING_PAYMENT_MINUTES_SAME_DAY = 20

function localDateYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

/** Citas con fecha posterior al día de reserva tienen ventana de 4 h; mismo día, 20 min. */
export function getPaymentWindowMs(
  appointmentDate: string,
  createdAt: string
): number {
  const bookingDate = localDateYmd(new Date(createdAt))
  if (appointmentDate > bookingDate) {
    return PENDING_PAYMENT_HOURS * 60 * 60 * 1000
  }
  return PENDING_PAYMENT_MINUTES_SAME_DAY * 60 * 1000
}

export function getPaymentDeadlineMs(
  appointmentDate: string,
  createdAt: string
): number {
  return new Date(createdAt).getTime() + getPaymentWindowMs(appointmentDate, createdAt)
}

export function getPaymentTimeRemainingMs(
  appointmentDate: string,
  createdAt: string,
  now = Date.now()
): number {
  return Math.max(0, getPaymentDeadlineMs(appointmentDate, createdAt) - now)
}

export function isPaymentDeadlineExpired(
  appointmentDate: string,
  createdAt: string,
  now = Date.now()
): boolean {
  return getPaymentTimeRemainingMs(appointmentDate, createdAt, now) <= 0
}

export function formatPaymentCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "Expirado"

  const totalSec = Math.floor(remainingMs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
  }

  return `${m}m ${String(s).padStart(2, "0")}s`
}

/** @deprecated Usar cancelExpiredPendingAppointments con lógica por cita. */
export function paymentDeadlineThresholdIso(
  hours = PENDING_PAYMENT_HOURS
): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export function isSameDayAppointmentBooking(
  appointmentDate: string,
  createdAt: string
): boolean {
  const bookingDate = localDateYmd(new Date(createdAt))
  return appointmentDate <= bookingDate
}
