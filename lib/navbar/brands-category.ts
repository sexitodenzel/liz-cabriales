import type { TiendaCategory } from "@/app/components/navbar/menuData"

export const BRANDS_CATEGORY_SLUG = "marcas"

export type BrandMenuItem = {
  name: string
  slug: string
  logo_url?: string | null
}

export function buildBrandsCategory(
  brands: BrandMenuItem[]
): TiendaCategory | null {
  if (brands.length === 0) return null
  return {
    label: "Marcas",
    slug: BRANDS_CATEGORY_SLUG,
    href: "/tienda",
    subcategories: brands.map((brand) => ({
      label: brand.name,
      href: `/tienda?marca=${encodeURIComponent(brand.name)}`,
    })),
  }
}

export function withBrandsCategory(
  categories: TiendaCategory[],
  brands: BrandMenuItem[]
): TiendaCategory[] {
  const brandsCategory = buildBrandsCategory(brands)
  if (!brandsCategory) return categories
  return [brandsCategory, ...categories]
}
