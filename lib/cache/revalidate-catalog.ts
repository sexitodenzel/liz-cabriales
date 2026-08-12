import { revalidateTag } from "next/cache"

/**
 * Tira la caché del catálogo público tras una edición en el panel.
 *
 * Las consultas de `lib/supabase/cache.ts` viven hasta 5 min, así que sin esto
 * un cambio del panel no se ve en la tienda hasta que la entrada vence sola.
 * Se agrupan las tres etiquetas porque una categoría viaja embebida dentro de
 * cada producto (`PRODUCT_SELECT` trae `categories(...)`): renombrarla sin
 * invalidar `products` dejaba el nombre viejo pegado en las tarjetas.
 */
export function revalidateCatalogTags(): void {
  revalidateTag("categories", "max")
  revalidateTag("products", "max")
  revalidateTag("brands", "max")
}
