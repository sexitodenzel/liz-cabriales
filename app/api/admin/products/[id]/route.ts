import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  Result,
  requireAdmin,
  softDeleteAdminProduct,
  updateAdminProduct,
} from "@/lib/supabase/admin"
import { updateProductSchema } from "@/lib/validations/products"

type RouteParams = {
  params: {
    id: string
  }
}

function mapResultToStatus(result: Result<unknown>, successStatus = 200) {
  if (!result.error) {
    return successStatus
  }

  if (result.error.code === "UNAUTHENTICATED") return 401
  if (result.error.code === "FORBIDDEN") return 403
  if (result.error.code === "NOT_FOUND") return 404
  return 400
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      const status = mapResultToStatus(authResult)
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status }
      )
    }

    const json = await request.json()
    const parseResult = updateProductSchema.safeParse(json)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Datos inválidos",
            code: "VALIDATION_ERROR",
            issues: parseResult.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const updateResult = await updateAdminProduct(id, parseResult.data)
    const status = mapResultToStatus(updateResult)

    return NextResponse.json(
      { data: updateResult.data, error: updateResult.error },
      { status }
    )
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Error interno del servidor",
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      const status = mapResultToStatus(authResult)
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status }
      )
    }

    const deleteResult = await softDeleteAdminProduct(id)
    const status = mapResultToStatus(deleteResult, 204)

    return NextResponse.json(
      { data: deleteResult.data, error: deleteResult.error },
      { status }
    )
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Error interno del servidor",
        },
      },
      { status: 500 }
    )
  }
}

