import { NextRequest, NextResponse } from "next/server"

import {
  createOrderFromActiveCart,
  type CreateOrderResult,
} from "@/lib/supabase/orders"
import { createClient } from "@/lib/supabase/server"
import { createOrderSchema } from "@/lib/validations/orders"

type ApiError = {
  message: string
  code?: string
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data: null,
      error: {
        message,
        code,
      },
    },
    { status }
  )
}

function mapErrorStatus(code?: string): number {
  if (code === "UNAUTHORIZED") return 401
  if (code === "VALIDATION_ERROR") return 400
  if (code === "CART_EMPTY") return 400
  if (code === "OUT_OF_STOCK") return 409
  return 500
}

async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      userId: null,
      response: errorResponse("No autorizado", 401, "UNAUTHORIZED") as NextResponse<
        ApiResponse<unknown>
      >,
    }
  }

  return {
    userId: user.id as string,
    response: null as NextResponse<ApiResponse<unknown>> | null,
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CreateOrderResult>>> {
  try {
    const { userId, response } = await requireAuthenticatedUser()
    if (!userId || response) {
      return response as NextResponse<ApiResponse<CreateOrderResult>>
    }

    let json: unknown

    try {
      json = await request.json()
    } catch {
      return errorResponse("Body invalido", 400, "VALIDATION_ERROR")
    }

    const parseResult = createOrderSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse("Datos invalidos", 400, "VALIDATION_ERROR")
    }

    // La creación usa la RPC `create_order_atomic` en Supabase (lib/supabase/orders.ts)
    // para insertar orden + ítems en una sola transacción.
    const createResult = await createOrderFromActiveCart(
      userId,
      parseResult.data
    )

    if (!createResult.data) {
      return errorResponse(
        createResult.error.message,
        mapErrorStatus(createResult.error.code),
        createResult.error.code
      )
    }

    return NextResponse.json(
      {
        data: createResult.data,
        error: null,
      },
      { status: 201 }
    )
  } catch {
    return errorResponse("Error interno del servidor", 500)
  }
}
