import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { updateAdminOrderStatusById } from "@/lib/supabase/adminOrders"
import { requireAdmin } from "@/lib/supabase/admin"
import { adminOrderStatusPatchSchema } from "@/lib/validations/adminOrders"
import {
  sendOrderShippedAlert,
  sendOrderDeliveredAlert,
} from "@/lib/notifications/order-notifications"
import { sendOrderShippedEmail } from "@/lib/email/templates/order-shipped"
import { sendOrderDeliveredEmail } from "@/lib/email/templates/order-delivered"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400

      return NextResponse.json(
        { data: null, error: authResult.error },
        { status }
      )
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Cuerpo de la petición inválido",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const parseResult = adminOrderStatusPatchSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Datos inválidos",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const updateResult = await updateAdminOrderStatusById(
      id,
      parseResult.data.status
    )

    if (updateResult.error) {
      return NextResponse.json(
        { data: null, error: updateResult.error },
        { status: 500 }
      )
    }

    // Hay que esperar los avisos: en Vercel la instancia se congela al devolver
    // la respuesta y una promesa suelta se muere sin llegar a enviarse ni a
    // loguear el fallo. Aquí se perdían los correos de "tu pedido va en camino"
    // y "fue entregado", que son los que el cliente sí espera.
    const newStatus = parseResult.data.status
    if (newStatus === "shipped") {
      await Promise.allSettled([
        sendOrderShippedAlert(id).catch((err) =>
          console.error(`[status] Error enviando WhatsApp shipped para orden ${id}:`, err)
        ),
        sendOrderShippedEmail(id).catch((err) =>
          console.error(`[status] Error enviando email shipped para orden ${id}:`, err)
        ),
      ])
    } else if (newStatus === "delivered") {
      await Promise.allSettled([
        sendOrderDeliveredAlert(id).catch((err) =>
          console.error(`[status] Error enviando WhatsApp delivered para orden ${id}:`, err)
        ),
        sendOrderDeliveredEmail(id).catch((err) =>
          console.error(`[status] Error enviando email delivered para orden ${id}:`, err)
        ),
      ])
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { message: "Error interno del servidor" },
      },
      { status: 500 }
    )
  }
}
