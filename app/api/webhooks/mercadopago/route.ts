import { createHmac } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

import {
  claimApprovedPaymentForOrder,
  clearCartForUser,
  deductStockForOrder,
  updateOrderStatusToPaid,
  updatePaymentStatusByOrderId,
} from "@/lib/supabase/payments"
import { sendOrderConfirmationEmail } from "@/lib/email/resend"

/**
 * ─── SQL ejecutado manualmente en Supabase SQL Editor (sin migraciones formales) ───
 *
 * 1) Columna `email_sent` en `payments` (idempotencia del webhook aprobado):
 *    ALTER TABLE payments ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT false;
 *
 * 2) Función transaccional `create_order_atomic` (orden + ítems en una sola transacción):
 *
 *    CREATE OR REPLACE FUNCTION create_order_atomic(
 *      p_user_id UUID,
 *      p_delivery_type TEXT,
 *      p_shipping_address TEXT,
 *      p_shipping_state TEXT,
 *      p_shipping_city TEXT,
 *      p_shipping_cost NUMERIC,
 *      p_total NUMERIC,
 *      p_items JSONB
 *    ) RETURNS UUID AS $$
 *    DECLARE
 *      v_order_id UUID;
 *      v_item JSONB;
 *    BEGIN
 *      INSERT INTO orders (user_id, status, total, delivery_type,
 *        shipping_address, shipping_state, shipping_city, shipping_cost)
 *      VALUES (p_user_id, 'pending', p_total, p_delivery_type,
 *        p_shipping_address, p_shipping_state, p_shipping_city, p_shipping_cost)
 *      RETURNING id INTO v_order_id;
 *
 *      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
 *        INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price)
 *        VALUES (
 *          v_order_id,
 *          (v_item->>'product_id')::UUID,
 *          (v_item->>'variant_id')::UUID,
 *          (v_item->>'quantity')::INT,
 *          (v_item->>'unit_price')::NUMERIC
 *        );
 *      END LOOP;
 *
 *      RETURN v_order_id;
 *    END;
 *    $$ LANGUAGE plpgsql SECURITY DEFINER;
 */

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
      const claimResult = await claimApprovedPaymentForOrder(orderId)
      if (claimResult.error) {
        console.error(
          `[webhook] Error al reclamar pago aprobado para orden ${orderId}:`,
          claimResult.error
        )
        return NextResponse.json({ received: true }, { status: 200 })
      }

      if (!claimResult.data.claimed) {
        return NextResponse.json({ ok: true }, { status: 200 })
      }

      const userId = claimResult.data.userId

      const orderPaidResult = await updateOrderStatusToPaid(orderId)
      if (orderPaidResult.error) {
        console.error(
          `[webhook] Error marcando orden ${orderId} como pagada:`,
          orderPaidResult.error
        )
      }

      await deductStockForOrder(orderId)

      try {
        await clearCartForUser(userId)
      } catch (cartError) {
        console.error(
          `[webhook] Error vaciando carrito para usuario ${userId}:`,
          cartError
        )
      }

      try {
        await sendOrderConfirmationEmail(orderId)
      } catch (emailError) {
        console.error(
          `[webhook] Error enviando email de confirmación para orden ${orderId}:`,
          emailError
        )
        // El fallo del email no interrumpe ni revierte el flujo del webhook
      }
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
