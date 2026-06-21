import type { Category, ProductWithCategory } from "@/lib/supabase/products"

type PickRelatedParams = {
  products: ProductWithCategory[]
  categories: Category[]
  categorySlugs: string[]
  brands: string[]
  excludeIds: Set<string>
  limit?: number
}

/**
 * Sugiere productos complementarios al contexto de filtro actual,
 * excluyendo los que ya están visibles en el grid.
 */
export function pickRelatedProductsForFilters({
  products,
  categories,
  categorySlugs,
  brands,
  excludeIds,
  limit = 8,
}: PickRelatedParams): ProductWithCategory[] {
  const collected: ProductWithCategory[] = []
  const seen = new Set<string>(excludeIds)

  const absorb = (candidates: ProductWithCategory[]) => {
    for (const product of candidates) {
      if (collected.length >= limit) break
      if (seen.has(product.id)) continue
      seen.add(product.id)
      collected.push(product)
    }
  }

  const sortFeatured = (a: ProductWithCategory, b: ProductWithCategory) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
    return a.name.localeCompare(b.name, "es")
  }

  const primaryCategorySlug = categorySlugs[0]
  const primaryCategory = primaryCategorySlug
    ? categories.find((c) => c.slug === primaryCategorySlug)
    : undefined

  if (primaryCategory) {
    absorb(
      products
        .filter((p) => p.category_id === primaryCategory.id)
        .sort(sortFeatured)
    )
  }

  const primaryBrand = brands[0]
  if (collected.length < limit && primaryBrand) {
    absorb(
      products
        .filter((p) => p.brand === primaryBrand)
        .sort(sortFeatured)
    )
  }

  if (collected.length < limit) {
    absorb(
      products
        .filter((p) => p.is_featured)
        .sort((a, b) => {
          const aUpdated = a.updated_at ?? ""
          const bUpdated = b.updated_at ?? ""
          return bUpdated.localeCompare(aUpdated)
        })
    )
  }

  if (collected.length < limit) {
    absorb([...products].sort(sortFeatured))
  }

  return collected.slice(0, limit)
}
