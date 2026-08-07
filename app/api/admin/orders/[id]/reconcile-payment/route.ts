import { NextResponse } from "next/server"
import { Payment } from "mercadopago"

import { getMercadoPagoClient } from "@/lib/mercadopago"
import { creditApprovedOrder } from "@/lib/payments/credit-order"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getAdminOrderById } from "@/lib/supabase/adminOrders"

/**
 * Reconciliación manual de un cobro de tienda.
 *
 * Le pregunta a MercadoPago por los pagos con `external_reference` = order id.
 * Si encuentra uno aprobado, acredita la orden por el mismo camino que el
 * webhook (`creditApprovedOrder`): stock, carrito, correos y alertas.
 *
 * Existe porque el webhook siempre responde 200 (MercadoPago no reintenta) y
 * un fallo puntual dejaría una compra cobrada sin acreditar. Nunca marca una
 * orden como pagada por decisión del admin: el dinero lo confirma MercadoPago.
 */

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
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

    const orderResult = await getAdminOrderById(id)
    if (!orderResult.data) {
      return NextResponse.json(
        {
          data: null,
          error: orderResult.error ?? {
            message: "Orden no encontrada",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      )
    }

    // ── Consultar a MercadoPago los pagos de esta orden ──────────────────────
    const paymentClient = new Payment(getMercadoPagoClient())

    let searchResult
    try {
      searchResult = await paymentClient.search({
        options: { external_reference: id },
      })
    } catch (mpError) {
      console.error(
        `[reconcile] Error consultando pagos de la orden ${id} en MercadoPago:`,
        mpError
      )
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "No se pudo consultar MercadoPago. Intenta de nuevo.",
            code: "PAYMENT_ERROR",
          },
        },
        { status: 502 }
      )
    }

    const results = searchResult.results ?? []
    const approved = results.find((p) => p.status === "approved")

    if (!approved) {
      const lastStatus = results[0]?.status ?? null
      return NextResponse.json({
        data: {
          credited: false,
          mp_status: lastStatus,
          message: lastStatus
            ? `MercadoPago reporta el pago como "${lastStatus}". No hay nada que acreditar.`
            : "MercadoPago no tiene ningún pago registrado para esta orden.",
        },
        error: null,
      })
    }

    const outcome = await creditApprovedOrder(id, "[reconcile]")

    if (outcome.status === "error") {
      return NextResponse.json(
        {
          data: null,
          error: { message: outcome.message, code: "CREDIT_ERROR" },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        credited: outcome.status === "credited",
        mp_status: "approved",
        message:
          outcome.status === "credited"
            ? "Pago encontrado en MercadoPago. La orden quedó pagada y se enviaron los correos."
            : "El pago ya estaba acreditado; no se hicieron cambios.",
      },
      error: null,
    })
  } catch (err) {
    console.error("[reconcile] Error inesperado:", err)
    return NextResponse.json(
      {
        data: null,
        error: { message: "Error interno del servidor", code: "INTERNAL" },
      },
      { status: 500 }
    )
  }
}
