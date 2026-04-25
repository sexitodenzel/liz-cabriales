import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { sendAppointmentReminderEmail } from "@/lib/email/templates/appointment-reminder"

/**
 * Vercel Cron Job — recordatorio 24h antes de la cita.
 *
 * Programado en vercel.json → "0 10 * * *" (10:00 UTC ≈ 04:00 Tampico).
 * Para llamadas locales manuales: pasar header `Authorization: Bearer <CRON_SECRET>`.
 *
 * Flujo:
 *  1. Verifica el header Authorization contra CRON_SECRET.
 *  2. Calcula la fecha "mañana" (zona horaria America/Monterrey, UTC-6).
 *  3. Selecciona appointments con date = mañana, status = 'paid',
 *     reminder_sent = false.
 *  4. Envía email a cada uno y marca reminder_sent = true.
 *  5. Retorna { data: { sent, failed }, error: null }.
 */

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

type ReminderResult = { sent: number; failed: number; date: string }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

/**
 * Retorna la fecha "mañana" en formato YYYY-MM-DD calculada en la zona
 * horaria local de Tampico (UTC-6). Vercel Cron corre en UTC.
 */
function tomorrowInTampicoTz(): string {
  const now = new Date()
  // Offset fijo de Tampico (no usa horario de verano desde 2022).
  const tampicoOffsetHours = -6
  const localMs =
    now.getTime() + tampicoOffsetHours * 60 * 60 * 1000 + 24 * 60 * 60 * 1000
  const local = new Date(localMs)
  const yyyy = local.getUTCFullYear()
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(local.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ReminderResult>>> {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error(
        "[cron/appointment-reminders] CRON_SECRET no configurado"
      )
      return errorResponse(
        "Configuración incompleta del servidor",
        500,
        "CRON_SECRET_MISSING"
      )
    }

    const authHeader = request.headers.get("authorization")
    const expected = `Bearer ${cronSecret}`
    if (authHeader !== expected) {
      return errorResponse("No autorizado", 401, "UNAUTHORIZED")
    }

    const targetDate = tomorrowInTampicoTz()

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("date", targetDate)
      .eq("status", "paid")
      .eq("reminder_sent", false)

    if (error) {
      console.error(
        "[cron/appointment-reminders] Error obteniendo citas:",
        error
      )
      return errorResponse(error.message, 500, error.code)
    }

    const rows = (data ?? []) as Array<{ id: string }>

    let sent = 0
    let failed = 0

    for (const row of rows) {
      try {
        await sendAppointmentReminderEmail(row.id)

        const { error: updErr } = await supabaseAdmin
          .from("appointments")
          .update({
            reminder_sent: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id)

        if (updErr) {
          console.error(
            `[cron/appointment-reminders] Error marcando reminder_sent para ${row.id}:`,
            updErr
          )
          failed += 1
        } else {
          sent += 1
        }
      } catch (err) {
        console.error(
          `[cron/appointment-reminders] Error enviando recordatorio para ${row.id}:`,
          err
        )
        failed += 1
      }
    }

    return NextResponse.json({
      data: { sent, failed, date: targetDate },
      error: null,
    })
  } catch (err) {
    console.error("[cron/appointment-reminders] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
