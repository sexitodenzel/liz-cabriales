import { getOnSaleProductsCached } from "@/lib/supabase/cache"
import NuevosLanzamientosCarousel from "./NuevosLanzamientosCarousel"

const HOME_MAX = 12

export default async function OfertasHome() {
  const { data: products, error } = await getOnSaleProductsCached()

  if (error || !products || products.length === 0) return null

  return (
    <NuevosLanzamientosCarousel
      products={products.slice(0, HOME_MAX)}
      titlePrefix="En"
      titleHighlight="Oferta"
      description="Productos con descuento por tiempo limitado. Aprovecha mientras haya inventario."
      sectionId="home-en-oferta-title"
      ctaHref="/tienda/ofertas"
      ctaLabel="Ver todas las ofertas"
    />
  )
}
