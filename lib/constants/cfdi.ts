/** Porcentaje aplicado al subtotal del carrito cuando el cliente solicita factura CFDI. */
export const CFDI_SURCHARGE_PERCENT = 4

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** Cargo en MXN sobre el subtotal (misma fórmula que en `createOrderFromActiveCart`). */
export function computeInvoiceSurchargeMxn(subtotal: number): number {
  return roundMoney((subtotal * CFDI_SURCHARGE_PERCENT) / 100)
}
