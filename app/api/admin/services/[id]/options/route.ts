import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  addOptionToService,
  getServiceOptionLinks,
  removeOptionFromService,
  setServiceOptionLinks,
} from "@/lib/supabase/servicesAdmin"
import {
  adminServiceInlineOptionSchema,
  adminServiceOptionLinksSchema,
} from "@/lib/validations/services"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

async function assertAdminOrReceptionist() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdminOrReceptionist(user?.id)
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const { id } = await context.params
    const result = await getServiceOptionLinks(id)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({ data: { links: result.data }, error: null })
  } catch (err) {
    console.error("[api/admin/services/[id]/options GET]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const { id } = await context.params

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = adminServiceInlineOptionSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await addOptionToService(id, parseResult.data)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    revalidateTag("services", "max")

    return NextResponse.json(
      { data: { option: result.data }, error: null },
      { status: 201 }
    )
  } catch (err) {
    console.error("[api/admin/services/[id]/options POST]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const { id: serviceId } = await context.params
    const optionId = request.nextUrl.searchParams.get("option_id")
    if (!optionId) {
      return errorResponse("Falta option_id", 400, "VALIDATION_ERROR")
    }

    const result = await removeOptionFromService(serviceId, optionId)
    if (result.error) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    revalidateTag("services", "max")

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/services/[id]/options DELETE]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const { id } = await context.params

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = adminServiceOptionLinksSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await setServiceOptionLinks(id, parseResult.data.links)
    if (result.error) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    revalidateTag("services", "max")

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/services/[id]/options PUT]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
