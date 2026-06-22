import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"
import { getOrderWithItemsForUser } from "@/lib/supabase/orders"
import { sendOrderQuestionEmail } from "@/lib/email/templates/order-question"

type ApiError = { message: string; code?: string }
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data: null, error: { message, code } },
    { status }
  )
}

const DANGEROUS_PATTERN =
  /(?:--|\/\*|\*\/|;\s*[\r\n]|\x00|<script|javascript:|<iframe)/i

const contactSchema = z.object({
  productId: z
    .string()
    .uuid()
    .nullable()
    .optional(),
  message: z
    .string()
    .trim()
    .min(5, "El mensaje es demasiado corto")
    .max(1000, "El mensaje es demasiado largo")
    .refine(
      (value) => !DANGEROUS_PATTERN.test(value),
      "El mensaje contiene caracteres no permitidos"
    ),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ sent: boolean }>>> {
  try {
    const user = await getAuthUser()
    if (!user) {
      return errorResponse("No autorizado", 401, "UNAUTHORIZED")
    }

    const { id: orderId } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse("JSON inválido", 400, "INVALID_BODY")
    }

    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const { productId, message } = parsed.data

    const orderResult = await getOrderWithItemsForUser(orderId, user.id)
    if (!orderResult.data) {
      return errorResponse("Pedido no encontrado", 404, "NOT_FOUND")
    }

    const order = orderResult.data

    let productName: string | null = null
    if (productId) {
      const match = order.items.find((item) => item.product_id === productId)
      if (!match) {
        return errorResponse(
          "El producto no pertenece a este pedido",
          400,
          "PRODUCT_NOT_IN_ORDER"
        )
      }
      productName =
        match.variant_name && match.variant_name !== match.product_name
          ? `${match.product_name} — ${match.variant_name}`
          : match.product_name
    }

    const profile = await getUserProfile(user.id)
    const clientName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Cliente"
    const clientEmail = profile?.email ?? user.email ?? ""

    if (!clientEmail) {
      return errorResponse(
        "No tenemos un correo de contacto en tu cuenta",
        400,
        "MISSING_EMAIL"
      )
    }

    await sendOrderQuestionEmail({
      order,
      clientName,
      clientEmail,
      productName,
      message,
    })

    return NextResponse.json({ data: { sent: true }, error: null })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error interno del servidor"
    return errorResponse(message, 500, "INTERNAL_ERROR")
  }
}
