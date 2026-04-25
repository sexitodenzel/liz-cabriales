import type { AppointmentStatus } from "@/types"

/** Horas mínimas de anticipación para cancelar una cita (cliente o validación). */
export const CANCEL_MIN_HOURS = 24

/** true si el cliente aún puede cancelar según la política de anticipación. */
export function appointmentAllowsClientCancel(appt: {
  date: string
  start_time: string
  status: AppointmentStatus
}): boolean {
  if (appt.status === "cancelled" || appt.status === "completed") {
    return false
  }
  const [yy, mm, dd] = appt.date.split("-").map(Number)
  const [hh, mi] = appt.start_time.slice(0, 5).split(":").map(Number)
  const apptDate = new Date(yy, mm - 1, dd, hh, mi, 0, 0)
  const limit = new Date(Date.now() + CANCEL_MIN_HOURS * 60 * 60 * 1000)
  return apptDate.getTime() >= limit.getTime()
}
