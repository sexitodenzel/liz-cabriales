// Validaciones compartidas del formulario de productos (panel admin).
// - Campos CRÍTICOS: bloquean el guardado (riesgo para la tienda o la base de datos).
// - Avisos de cordura (sanity): no bloquean, solo piden confirmación "¿estás seguro?".

export type ProductFormSnapshot = {
  name: string
  slug: string
  categoryId: string
  basePrice: string
  costPrice: string
  wholesalePrice: string
  initialStock?: string
  stock?: string
}

export type VariantSnapshot = {
  variantName: string
  price: string
  stock: string
  colorHex?: string
  _toDelete?: boolean
}

export type FieldErrors = Record<string, string>

const SLUG_RE = /^[a-z0-9-]+$/

// Umbrales para considerar un valor "absurdo" (solo disparan confirmación).
export const PRICE_MAX_SANE = 100_000
export const STOCK_MAX_SANE = 10_000

export function variantNameKey(index: number): string {
  return `variant_${index}_name`
}
export function variantPriceKey(index: number): string {
  return `variant_${index}_price`
}
export function variantStockKey(index: number): string {
  return `variant_${index}_stock`
}
export function variantColorHexKey(index: number): string {
  return `variant_${index}_color_hex`
}

const COLOR_HEX_RE = /^#[0-9A-Fa-f]{6}$/
export function isValidColorHex(value: string | null | undefined): boolean {
  if (!value) return true
  return COLOR_HEX_RE.test(value)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)
}

export function validateProductCritical(
  form: ProductFormSnapshot,
  variants: VariantSnapshot[],
  opts: { categoryValid: boolean; brandValid?: boolean }
): FieldErrors {
  const errors: FieldErrors = {}

  if (!form.name.trim()) {
    errors.name = "El nombre es obligatorio."
  }

  if (!form.slug.trim()) {
    errors.slug = "El slug es obligatorio."
  } else if (!SLUG_RE.test(form.slug.trim())) {
    errors.slug = "Solo minúsculas, números y guiones."
  }

  if (!form.categoryId) {
    errors.categoryId = "Selecciona una categoría."
  } else if (!opts.categoryValid) {
    errors.categoryId = "La categoría ya no está disponible."
  }

  if (opts.brandValid === false) {
    errors.brand = "La marca ya no está disponible."
  }

  const basePrice = Number(form.basePrice)
  if (form.basePrice.trim() === "") {
    errors.basePrice = "El precio de venta es obligatorio."
  } else if (Number.isNaN(basePrice)) {
    errors.basePrice = "Debe ser un número."
  } else if (basePrice < 0) {
    errors.basePrice = "No puede ser negativo."
  }

  if (form.costPrice.trim() !== "" && Number.isNaN(Number(form.costPrice))) {
    errors.costPrice = "Debe ser un número."
  }
  if (
    form.wholesalePrice.trim() !== "" &&
    Number.isNaN(Number(form.wholesalePrice))
  ) {
    errors.wholesalePrice = "Debe ser un número."
  }

  variants.forEach((variant, index) => {
    if (variant._toDelete) return

    if (!variant.variantName.trim()) {
      errors[variantNameKey(index)] = "Nombre requerido."
    }

    const price = Number(variant.price)
    if (
      variant.price.trim() === "" ||
      Number.isNaN(price) ||
      price < 0
    ) {
      errors[variantPriceKey(index)] = "Precio inválido."
    }

    const stock = Number(variant.stock)
    if (
      variant.stock.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      errors[variantStockKey(index)] = "Stock inválido."
    }

    if (variant.colorHex && !isValidColorHex(variant.colorHex)) {
      errors[variantColorHexKey(index)] = "Color inválido (#RRGGBB)."
    }
  })

  return errors
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  slug: "Slug",
  categoryId: "Categoría",
  brand: "Marca",
  basePrice: "Precio de venta",
  costPrice: "Precio costo",
  wholesalePrice: "Precio mayoreo",
}

export function summarizeErrors(errors: FieldErrors): string[] {
  const out: string[] = []
  for (const key of Object.keys(errors)) {
    if (key in FIELD_LABELS) out.push(FIELD_LABELS[key])
  }
  const hasVariantErrors = Object.keys(errors).some((key) =>
    key.startsWith("variant_")
  )
  if (hasVariantErrors) out.push("Presentaciones incompletas")
  return Array.from(new Set(out))
}

export function collectSanityWarnings(
  form: ProductFormSnapshot,
  variants: VariantSnapshot[]
): string[] {
  const warnings: string[] = []

  const basePrice = Number(form.basePrice)
  const hasBase = form.basePrice.trim() !== "" && !Number.isNaN(basePrice)
  const costPrice =
    form.costPrice.trim() === "" ? null : Number(form.costPrice)
  const wholesale =
    form.wholesalePrice.trim() === "" ? null : Number(form.wholesalePrice)

  if (hasBase) {
    if (basePrice === 0) warnings.push("El precio de venta es $0.")
    if (basePrice > PRICE_MAX_SANE) {
      warnings.push(`Precio de venta muy alto: ${formatMoney(basePrice)}.`)
    }
  }
  if (
    costPrice !== null &&
    !Number.isNaN(costPrice) &&
    hasBase &&
    costPrice > basePrice
  ) {
    warnings.push("El precio costo es mayor que el precio de venta.")
  }
  if (
    wholesale !== null &&
    !Number.isNaN(wholesale) &&
    hasBase &&
    wholesale > basePrice
  ) {
    warnings.push("El precio de mayoreo es mayor que el precio de venta.")
  }

  const initial =
    form.initialStock && form.initialStock.trim() !== ""
      ? Number(form.initialStock)
      : null
  if (initial !== null && !Number.isNaN(initial) && initial > STOCK_MAX_SANE) {
    warnings.push(`Inventario inicial muy alto: ${initial}.`)
  }

  const stock =
    form.stock && form.stock.trim() !== "" ? Number(form.stock) : null
  if (stock !== null && !Number.isNaN(stock) && stock > STOCK_MAX_SANE) {
    warnings.push(`Inventario muy alto: ${stock}.`)
  }

  variants.forEach((variant) => {
    if (variant._toDelete) return
    const label = variant.variantName.trim() || "(sin nombre)"
    const price = Number(variant.price)
    const st = Number(variant.stock)

    if (variant.price.trim() !== "" && !Number.isNaN(price)) {
      if (price === 0) warnings.push(`Presentación "${label}": precio $0.`)
      if (price > PRICE_MAX_SANE) {
        warnings.push(
          `Presentación "${label}": precio muy alto (${formatMoney(price)}).`
        )
      }
    }
    if (variant.stock.trim() !== "" && !Number.isNaN(st) && st > STOCK_MAX_SANE) {
      warnings.push(`Presentación "${label}": stock muy alto (${st}).`)
    }
  })

  return warnings
}
