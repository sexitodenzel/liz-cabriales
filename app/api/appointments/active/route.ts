import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  cancelExpiredPendingAppointments,
  completePastAppointments,
  getUserActiveAppointment,
  type AppointmentRecord,
} from "@/lib/supabase/appointments"
import { getStudioSettingsCached } from "@/lib/supabase/studio-settings"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

export async function GET(): Promise<
  NextResponse<
    ApiResponse<{
      appointment: AppointmentRecord | null
      transfer_account_number: string
    }>
  >
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("No autorizado", 401, "UNAUTHENTICATED")
    }

    await cancelExpiredPendingAppointments({ userId: user.id })
    await completePastAppointments({ userId: user.id })

    const [active, settings] = await Promise.all([
      getUserActiveAppointment(user.id),
      getStudioSettingsCached(),
    ])

    if (active.error) {
      return errorResponse(active.error.message, 500, active.error.code)
    }

    return NextResponse.json({
      data: {
        appointment: active.data,
        transfer_account_number: settings.transfer_account_number,
      },
      error: null,
    })
  } catch (err) {
    console.error("[api/appointments/active GET]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
