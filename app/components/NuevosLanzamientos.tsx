import { getFeaturedProducts } from "@/lib/supabase/products"
import NuevosLanzamientosCarousel from "./NuevosLanzamientosCarousel"

export default async function NuevosLanzamientos() {
  const { data: products, error } = await getFeaturedProducts()

  if (error || !products || products.length === 0) return null

  return <NuevosLanzamientosCarousel products={products} />
}
