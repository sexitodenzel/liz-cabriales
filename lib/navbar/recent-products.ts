import type { TiendaCategory } from "@/app/components/navbar/menuData"

export const RECENT_PRODUCTS_CATEGORY_SLUG = "nuevos-lanzamientos"

export type RecentProductMenuItem = {
  name: string
  slug: string
}

export function buildRecentProductsCategory(
  products: RecentProductMenuItem[]
): TiendaCategory {
  return {
    label: "Nuevos lanzamientos",
    slug: RECENT_PRODUCTS_CATEGORY_SLUG,
    href: "/tienda/nuevos",
    subcategories: products.map((product) => ({
      label: product.name,
      href: `/tienda/${product.slug}`,
    })),
  }
}

export function withRecentProductsCategory(
  categories: TiendaCategory[],
  products: RecentProductMenuItem[]
): TiendaCategory[] {
  return [buildRecentProductsCategory(products), ...categories]
}
