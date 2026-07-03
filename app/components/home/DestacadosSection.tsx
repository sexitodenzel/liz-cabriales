import {
  getBestSellersCached,
  getNewestProductsCached,
  getOnSaleProductsCached,
} from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"
import TabbedShopper, {
  type ShopperProduct,
  type ShopperTab,
} from "./TabbedShopper"

/* Un solo bloque de tabs comprables para En oferta / Nuevos / Best sellers,
   con el mismo patrón que la sección de categorías. */

const PER_TAB = 8

function toShopperProducts(products: ProductWithCategory[]): ShopperProduct[] {
  return products.slice(0, PER_TAB).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    base_price: product.base_price,
    discount_percent: product.discount_percent,
    image: product.images?.[0] ?? null,
  }))
}

export default async function DestacadosSection() {
  const [saleResult, newResult, bestResult] = await Promise.all([
    getOnSaleProductsCached(),
    getNewestProductsCached(),
    getBestSellersCached(),
  ])

  const candidates: ShopperTab[] = [
    {
      id: "ofertas",
      name: "En oferta",
      href: "/tienda/ofertas",
      products: toShopperProducts(saleResult.error ? [] : saleResult.data),
    },
    {
      id: "nuevos",
      name: "Nuevos",
      href: "/tienda/nuevos",
      products: toShopperProducts(newResult.error ? [] : newResult.data),
    },
    {
      id: "best-sellers",
      name: "Best sellers",
      href: "/tienda/mas-vendidos",
      products: toShopperProducts(bestResult.error ? [] : bestResult.data),
    },
  ]

  const tabs = candidates.filter((tab) => tab.products.length > 0)
  if (tabs.length === 0) return null

  return (
    <section
      id="home-destacados-title"
      className="py-12 md:py-16"
      aria-label="En oferta, nuevos y best sellers"
    >
      <TabbedShopper tabs={tabs} centerTabs />
    </section>
  )
}
