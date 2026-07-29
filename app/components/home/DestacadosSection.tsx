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
    variants: product.variants ?? [],
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
      id: "best-sellers",
      name: "Más vendidos",
      href: "/tienda/mas-vendidos",
      badge: "Más vendido",
      products: toShopperProducts(bestResult.error ? [] : bestResult.data),
    },
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
      badge: "Nuevo",
      products: toShopperProducts(newResult.error ? [] : newResult.data),
    },
  ]

  // Siempre las 3 pestañas (Más vendidos / En oferta / Nuevos), aunque alguna
  // venga vacía: evita que desaparezcan del header en móvil.
  if (candidates.every((tab) => tab.products.length === 0)) return null

  return (
    <section
      id="home-destacados-title"
      className="py-12 md:py-16"
      aria-label="Más vendidos, en oferta y nuevos"
    >
      <TabbedShopper
        tabs={candidates}
        title="Compra los productos"
      />
    </section>
  )
}
