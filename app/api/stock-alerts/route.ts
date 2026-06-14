import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  cancelStockAlert,
  getUserStockAlert,
  subscribeStockAlert,
} from "@/lib/supabase/stockAlerts"
import { stockAlertVariantSchema } from "@/lib/validations/stockAlerts"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function mapErrorStatus(code?: string): number {
  if (code === "UNAUTHORIZED") return 401
  if (code === "NOT_FOUND") return 404
  if (code === "NOT_OUT_OF_STOCK" || code === "ALREADY_SUBSCRIBED") return 409
  if (code === "VALIDATION_ERROR") return 400
  return 500
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ subscribed: boolean }>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "No autorizado", code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    const variantId = request.nextUrl.searchParams.get("variantId")
    const parseResult = stockAlertVariantSchema.safeParse({ variantId })
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: parseResult.error.issues[0]?.message ?? "Datos inválidos",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const result = await getUserStockAlert(
      supabase,
      user.id,
      parseResult.data.variantId
    )
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapErrorStatus(result.error.code) }
      )
    }

    return NextResponse.json({
      data: { subscribed: Boolean(result.data) },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ subscribed: true }>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "No autorizado", code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: "Body inválido", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const parseResult = stockAlertVariantSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: parseResult.error.issues[0]?.message ?? "Datos inválidos",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const result = await subscribeStockAlert(
      supabase,
      user.id,
      parseResult.data.variantId
    )
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapErrorStatus(result.error.code) }
      )
    }

    return NextResponse.json({ data: { subscribed: true }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "No autorizado", code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: "Body inválido", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const parseResult = stockAlertVariantSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: parseResult.error.issues[0]?.message ?? "Datos inválidos",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const result = await cancelStockAlert(
      supabase,
      user.id,
      parseResult.data.variantId
    )
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapErrorStatus(result.error.code) }
      )
    }

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
