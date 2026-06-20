export const FREE_SHIPPING_THRESHOLD_MXN = 1999

export function formatFreeShippingThreshold(): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD_MXN)
}
