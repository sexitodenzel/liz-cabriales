import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import { deleteServiceFilter } from "@/lib/supabase/servicesAdmin"

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const result = await deleteServiceFilter(id)
    if (result.error) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    revalidateTag("services", "max")
    revalidatePath("/servicios")

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/service-filters/[id] DELETE]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
