import { createHmac } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

import {
  deductStockForOrder,
  updatePaymentStatusByOrderId,
} from "@/lib/supabase/payments"

type WebhookBody = {
  type?: string
  action?: string
  data?: { id?: string | number }
}

/**
 * Verifica la firma del webhook de MercadoPago.
 * Formato esperado de x-signature: "ts=TIMESTAMP,v1=HASH"
 * Contenido firmado: "id:{dataId};request-id:{xRequestId};ts:{ts};"
 */
function verifyWebhookSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!signature || !requestId) return false

  const parts = signature
    .split(",")
    .reduce<Record<string, string>>((acc, part) => {
      const eqIndex = part.indexOf("=")
      if (eqIndex !== -1) {
        const key = part.slice(0, eqIndex).trim()
        const value = part.slice(eqIndex + 1).trim()
        acc[key] = value
      }
      return acc
    }, {})

  const ts = parts["ts"]
  const v1 = parts["v1"]

  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const computed = createHmac("sha256", secret).update(manifest).digest("hex")

  return computed === v1
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: WebhookBody
    try {
      body = (await request.json()) as WebhookBody
    } catch {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Solo procesamos notificaciones de tipo "payment"
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const dataId = String(body.data.id)
    const signature = request.headers.get("x-signature")
    const requestId = request.headers.get("x-request-id")
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET

    // Verificar firma si el secret está configurado
    if (webhookSecret) {
      const isValid = verifyWebhookSignature(
        signature,
        requestId,
        dataId,
        webhookSecret
      )
      if (!isValid) {
        console.warn(
          `[webhook] Firma inválida para data.id=${dataId}. ` +
          "Verificar que MERCADOPAGO_WEBHOOK_SECRET coincida con la clave del dashboard de MP."
        )
        // Retornar 200 para que MP no reintente con una firma incorrecta
        return NextResponse.json({ received: true }, { status: 200 })
      }
    }

    // Obtener información del pago desde MercadoPago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const paymentClient = new Payment(client)
    let paymentInfo
    try {
      paymentInfo = await paymentClient.get({ id: dataId })
    } catch (err) {
      console.error(
        `[webhook] Error obteniendo pago ${dataId} desde MercadoPago:`,
        err
      )
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const mpStatus = paymentInfo.status
    const orderId = paymentInfo.external_reference

    if (!orderId) {
      console.warn(
        `[webhook] El pago ${dataId} no tiene external_reference (order_id)`
      )
      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (mpStatus === "approved") {
      const updateResult = await updatePaymentStatusByOrderId(
        orderId,
        "approved",
        "paid"
      )
      if (updateResult.error) {
        console.error(
          `[webhook] Error actualizando estado para orden ${orderId}:`,
          updateResult.error
        )
      }
      await deductStockForOrder(orderId)
    } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
      const updateResult = await updatePaymentStatusByOrderId(
        orderId,
        "rejected",
        "cancelled"
      )
      if (updateResult.error) {
        console.error(
          `[webhook] Error actualizando estado para orden ${orderId}:`,
          updateResult.error
        )
      }
    }
    // pending / in_process: sin cambios, esperamos la siguiente notificación

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error("[webhook] Error inesperado:", err)
    // Siempre retornar 200 para que MP no reintente indefinidamente
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
