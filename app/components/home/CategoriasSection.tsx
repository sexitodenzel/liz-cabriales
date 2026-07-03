import { getAllProductsCached, getCategoriesCached } from "@/lib/supabase/cache"
import TabbedShopper, {
  type ShopperProduct,
  type ShopperTab,
} from "./TabbedShopper"

/* Compra por categoría: tabs con productos comprables debajo, para comprar
   desde la landing sin navegar toda la tienda. Solo aparecen categorías
   con productos activos. */

const PRODUCTS_PER_CATEGORY = 8

export default async function CategoriasSection() {
  const [categoriesResult, productsResult] = await Promise.all([
    getCategoriesCached(),
    getAllProductsCached(),
  ])

  const categories =
    categoriesResult.error || !categoriesResult.data ? [] : categoriesResult.data
  const products =
    productsResult.error || !productsResult.data ? [] : productsResult.data

  if (categories.length === 0 || products.length === 0) return null

  // Destacados primero, luego los más recientes.
  const sorted = [...products].sort(
    (a, b) =>
      Number(b.is_featured) - Number(a.is_featured) ||
      (b.created_at ?? "").localeCompare(a.created_at ?? "")
  )

  const byCategory = new Map<string, ShopperProduct[]>()
  for (const product of sorted) {
    const list = byCategory.get(product.category_id) ?? []
    if (list.length >= PRODUCTS_PER_CATEGORY) continue
    list.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      base_price: product.base_price,
      discount_percent: product.discount_percent,
      image: product.images?.[0] ?? null,
    })
    byCategory.set(product.category_id, list)
  }

  const tabs: ShopperTab[] = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      href: `/tienda?categoria=${encodeURIComponent(category.slug)}`,
      products: byCategory.get(category.id) ?? [],
    }))
    .filter((tab) => tab.products.length > 0)

  if (tabs.length === 0) return null

  return (
    <section
      className="py-12 md:py-16"
      aria-labelledby="home-categorias-title"
    >
      <header className="mb-8 text-center md:mb-10">
        <h2
          id="home-categorias-title"
          className="font-display text-[clamp(20px,2.4vw,28px)] font-medium tracking-[-0.01em] text-ink"
        >
          Compra por colección
        </h2>
        <div className="mx-auto mt-3 h-px w-12 bg-gold-soft" aria-hidden />
      </header>
      <TabbedShopper tabs={tabs} />
    </section>
  )
}
