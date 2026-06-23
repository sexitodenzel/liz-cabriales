export function clampDiscountPercent(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  if (numeric <= 0) return 0
  if (numeric > 95) return 95
  return Math.round(numeric)
}

export function applyDiscount(
  price: number,
  discountPercent: number | null | undefined
): number {
  const percent = clampDiscountPercent(discountPercent)
  if (percent === 0) return price
  const discounted = price * (1 - percent / 100)
  return Math.round(discounted * 100) / 100
}

export function hasDiscount(
  discountPercent: number | null | undefined
): boolean {
  return clampDiscountPercent(discountPercent) > 0
}
