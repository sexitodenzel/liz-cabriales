import {
  claimApprovedPaymentForOrder,
  claimPendingOrderByStatusSwap,
  clearCartForUser,
  deductStockForOrder,
  updateOrderStatusToPaid,
} from "@/lib/supabase/payments"
import { sendOrderConfirmationEmail } from "@/lib/email/resend"
import { sendAdminNewOrderEmail } from "@/lib/email/admin"
import { sendNewOrderAlerts } from "@/lib/notifications/order-notifications"

export type CreditOrderOutcome =
  | { status: "credited" }
  | { status: "already_credited" }
  | { status: "error"; message: string }

/**
 * Acredita una orden de tienda cuyo pago ya se confirmó como aprobado en
 * MercadoPago: marca la orden como pagada, descuenta stock, vacía el carrito
 * y dispara correos y alertas.
 *
 * Es el único camino de acreditación: lo usan tanto el webhook como la
 * reconciliación manual desde el panel, para que un pago recuperado a mano
 * tenga exactamente los mismos efectos que uno acreditado automáticamente.
 *
 * Idempotente por dos vías: la fila de `payments` (`email_sent`) y, si esa
 * fila no existe, un compare-and-swap sobre el estado de la orden.
 *
 * IMPORTANTE: solo llamar después de verificar con MercadoPago que el pago
 * está `approved`.
 */
export async function creditApprovedOrder(
  orderId: string,
  logPrefix = "[credit-order]"
): Promise<CreditOrderOutcome> {
  const claimResult = await claimApprovedPaymentForOrder(orderId)
  if (claimResult.error) {
    console.error(
      `${logPrefix} Error al reclamar pago aprobado para orden ${orderId}:`,
      claimResult.error
    )
    return { status: "error", message: claimResult.error.message }
  }

  let userId: string

  if (claimResult.data.claimed) {
    userId = claimResult.data.userId
  } else {
    // Sin fila reclamable: o ya se acreditó (evento repetido) o nunca se
    // guardó el registro de pago. El swap de estado distingue ambos casos de
    // forma atómica sin arriesgar doble descuento de stock.
    const swapResult = await claimPendingOrderByStatusSwap(orderId)
    if (swapResult.error) {
      console.error(
        `${logPrefix} Error en el fallback de acreditación para orden ${orderId}:`,
        swapResult.error
      )
      return { status: "error", message: swapResult.error.message }
    }

    if (!swapResult.data.claimed) {
      return { status: "already_credited" }
    }

    console.warn(
      `${logPrefix} Orden ${orderId} acreditada sin fila reclamable en 'payments'. ` +
      "Revisar por qué no se registró el pago al crear la preferencia."
    )
    userId = swapResult.data.userId
  }

  const orderPaidResult = await updateOrderStatusToPaid(orderId)
  if (orderPaidResult.error) {
    console.error(
      `${logPrefix} Error marcando orden ${orderId} como pagada:`,
      orderPaidResult.error
    )
  }

  await deductStockForOrder(orderId)

  try {
    await clearCartForUser(userId)
  } catch (cartError) {
    console.error(
      `${logPrefix} Error vaciando carrito para usuario ${userId}:`,
      cartError
    )
  }

  try {
    await sendOrderConfirmationEmail(orderId)
  } catch (emailError) {
    console.error(
      `${logPrefix} Error enviando email de confirmación para orden ${orderId}:`,
      emailError
    )
  }

  sendAdminNewOrderEmail(orderId).catch((err) =>
    console.error(
      `${logPrefix} Error enviando alerta admin para orden ${orderId}:`,
      err
    )
  )

  try {
    await sendNewOrderAlerts(orderId)
  } catch (waError) {
    console.error(
      `${logPrefix} Error enviando alertas WhatsApp para orden ${orderId}:`,
      waError
    )
  }

  return { status: "credited" }
}
