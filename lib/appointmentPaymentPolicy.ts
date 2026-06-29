/** Horas para completar el pago de una cita en estado `pending`. */
export const PENDING_PAYMENT_HOURS = 4

export function getPaymentDeadlineMs(
  createdAt: string,
  hours = PENDING_PAYMENT_HOURS
): number {
  return new Date(createdAt).getTime() + hours * 60 * 60 * 1000
}

export function getPaymentTimeRemainingMs(
  createdAt: string,
  now = Date.now(),
  hours = PENDING_PAYMENT_HOURS
): number {
  return Math.max(0, getPaymentDeadlineMs(createdAt, hours) - now)
}

export function isPaymentDeadlineExpired(
  createdAt: string,
  now = Date.now(),
  hours = PENDING_PAYMENT_HOURS
): boolean {
  return getPaymentTimeRemainingMs(createdAt, now, hours) <= 0
}

export function formatPaymentCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "Expirado"

  const totalSec = Math.floor(remainingMs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
}

export function paymentDeadlineThresholdIso(
  hours = PENDING_PAYMENT_HOURS
): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}
