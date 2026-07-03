import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { cancelExpiredPendingAppointments, completePastAppointments } from "@/lib/supabase/appointments"
import { paymentDeadlineThresholdIso } from "@/lib/appointmentPaymentPolicy"

/**
 * Cron de limpieza: cancela órdenes, citas e inscripciones que llevan
 * demasiado tiempo en estado `pending` (usuario abandonó sin pagar).
 *
 * Llamar con header `Authorization: Bearer <CRON_SECRET>` o con
 * query param `?secret=<CRON_SECRET>`.
 *
 * Recomendado: correr cada 30 min - 1 hora.
 *
 * Ejemplos de invocación:
 *   curl https://tu-sitio.com/api/cron/cleanup-pending \
 *        -H "Authorization: Bearer $CRON_SECRET"
 *
 * Configuración vía env vars (opcional):
 *   CRON_SECRET                   — token requerido (obligatorio en prod)
 *   CLEANUP_ORDERS_HOURS          — default 2
 *   CLEANUP_APPOINTMENTS_HOURS    — default 4
 *   CLEANUP_REGISTRATIONS_HOURS   — default 2
 */

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hoursAgo(hours: number): string {
  return paymentDeadlineThresholdIso(hours)
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // In dev sin CRON_SECRET configurado, permitir para facilitar testing
    return process.env.NODE_ENV !== "production"
  }
  const header = request.headers.get("authorization") ?? ""
  const headerToken = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null
  const queryToken = request.nextUrl.searchParams.get("secret")
  return headerToken === secret || queryToken === secret
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  const ordersHours = Number(process.env.CLEANUP_ORDERS_HOURS ?? 2)
  const appointmentsHours = Number(
    process.env.CLEANUP_APPOINTMENTS_HOURS ?? 4
  )
  const registrationsHours = Number(
    process.env.CLEANUP_REGISTRATIONS_HOURS ?? 2
  )

  const results = {
    orders: 0,
    appointments: 0,
    appointments_completed: 0,
    registrations: 0,
    errors: [] as string[],
  }

  // ── Órdenes abandonadas ──────────────────────────────────────────────────
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("status", "pending")
      .lt("created_at", hoursAgo(ordersHours))
      .select("id")
    if (error) {
      results.errors.push(`orders: ${error.message}`)
    } else {
      results.orders = data?.length ?? 0
    }
  } catch (err) {
    results.errors.push(`orders: ${(err as Error).message}`)
  }

  // ── Citas abandonadas (ventana 4 h o 20 min según fecha de la cita) ─────
  try {
    const apptResult = await cancelExpiredPendingAppointments()
    if (apptResult.error) {
      results.errors.push(`appointments: ${apptResult.error.message}`)
    } else {
      results.appointments = apptResult.data ?? 0
    }
  } catch (err) {
    results.errors.push(`appointments: ${(err as Error).message}`)
  }

  try {
    const completeResult = await completePastAppointments()
    if (completeResult.error) {
      results.errors.push(`appointments_complete: ${completeResult.error.message}`)
    } else {
      results.appointments_completed = completeResult.data ?? 0
    }
  } catch (err) {
    results.errors.push(`appointments_complete: ${(err as Error).message}`)
  }

  // ── Inscripciones abandonadas ────────────────────────────────────────────
  try {
    const { data, error } = await supabaseAdmin
      .from("course_registrations")
      .update({ status: "cancelled" })
      .eq("status", "pending")
      .lt("created_at", hoursAgo(registrationsHours))
      .select("id")
    if (error) {
      results.errors.push(`registrations: ${error.message}`)
    } else {
      results.registrations = data?.length ?? 0
    }
  } catch (err) {
    results.errors.push(`registrations: ${(err as Error).message}`)
  }

  return NextResponse.json({
    ok: results.errors.length === 0,
    cancelled: {
      orders: results.orders,
      appointments: results.appointments,
      appointments_completed: results.appointments_completed,
      registrations: results.registrations,
    },
    thresholds: {
      orders_hours: ordersHours,
      appointments_hours: appointmentsHours,
      registrations_hours: registrationsHours,
    },
    errors: results.errors,
    ran_at: new Date().toISOString(),
  })
}
