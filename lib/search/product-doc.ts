import type { ProductWithCategory } from "@/lib/supabase/products"
import { applyDiscount } from "@/lib/tienda/discount"

import type { SearchDoc } from "./engine"

/**
 * Producto → documento de búsqueda. Vive aparte porque lo usan dos lados:
 * el índice del servidor (autocompletado y /buscar) y el filtro de la tienda,
 * que corre en el navegador sobre el catálogo ya cargado. Misma receta en los
 * dos = mismo orden de resultados.
 */
export function productToSearchDoc(
  product: ProductWithCategory,
  options: { id?: string; synonyms?: string; body?: string } = {}
): SearchDoc {
  const discountPercent = product.discount_percent ?? 0
  return {
    id: options.id ?? product.id,
    type: "product",
    title: product.name,
    subtitle: product.brand ?? null,
    href: `/tienda/${product.slug}`,
    image: product.images?.[0] ?? null,
    price: applyDiscount(product.base_price, discountPercent),
    originalPrice: product.base_price,
    discountPercent,
    meta: null,
    keywords: [
      product.brand ?? "",
      product.category?.name ?? "",
      product.subcategory ?? "",
      product.slug?.replace(/-/g, " ") ?? "",
      options.synonyms ?? "",
    ]
      .filter(Boolean)
      .join(" "),
    body: options.body ?? "",
    boost:
      1 + (product.is_best_seller ? 0.08 : 0) + (product.is_featured ? 0.05 : 0),
  }
}
