import { getFeaturedProductsCached } from "@/lib/supabase/cache"
import NuevosLanzamientosCarousel from "./NuevosLanzamientosCarousel"

export default async function NuevosLanzamientos() {
  const { data: products, error } = await getFeaturedProductsCached()

  if (error || !products || products.length === 0) return null

  return <NuevosLanzamientosCarousel products={products} />
}
