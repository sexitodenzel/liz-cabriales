import {
  checkPaymentCoversOrder,
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
  /** Se pagó menos que el total vigente: la orden NO se acredita. */
  | { status: "amount_mismatch"; expected: number; paid: number }
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
 *
 * `paidAmount` es el `transaction_amount` que reporta MercadoPago. Cuando se
 * pasa, se compara contra el total vigente de la orden y se aborta si no
 * alcanza. Es opcional para no romper llamadas viejas, pero DEBE pasarse
 * siempre que se tenga: es la única defensa contra acreditar de más.
 */
export async function creditApprovedOrder(
  orderId: string,
  logPrefix = "[credit-order]",
  paidAmount?: number | null
): Promise<CreditOrderOutcome> {
  // Guarda de dinero, antes de reclamar nada: si el importe no cubre el total,
  // la orden se queda en pendiente y no se descuenta stock ni se manda correo
  // de confirmación. Se resuelve a mano desde el panel (cobrar la diferencia o
  // reembolsar), que es una decisión de negocio, no del webhook.
  if (typeof paidAmount === "number" && Number.isFinite(paidAmount)) {
    const check = await checkPaymentCoversOrder(orderId, paidAmount)
    if (check.error) {
      console.error(
        `${logPrefix} No se pudo verificar el monto de la orden ${orderId}:`,
        check.error
      )
      return { status: "error", message: check.error.message }
    }

    if (!check.data.covers) {
      const { expected, paid } = check.data
      console.error(
        `${logPrefix} PAGO INSUFICIENTE en la orden ${orderId}: ` +
        `MercadoPago reporta $${paid} y el pedido suma $${expected}. ` +
        "La orden NO se acreditó. Revisar en el panel: probablemente se pagó " +
        "un link viejo generado antes de que cambiara el total."
      )
      return { status: "amount_mismatch", expected, paid }
    }
  }

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

  // Con await. Hoy sobrevive de casualidad porque debajo hay otro await que
  // mantiene viva la función; si alguien quita esa llamada, este correo dejaría
  // de salir en silencio.
  await sendAdminNewOrderEmail(orderId).catch((err) =>
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
