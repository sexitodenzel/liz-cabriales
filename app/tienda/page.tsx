import type { Metadata } from "next"

import {
  isAbrasivityValue,
  type AbrasivityValue,
} from "@/lib/constants/abrasivity"
import {
  getAllBrandsFullCached,
  getAllProductsCached as getProducts,
  getBrandsCached as getBrands,
  getCategoriesCached as getCategories,
  getServicesCached,
} from "@/lib/supabase/cache"
import { getPublishedCourses } from "@/lib/supabase/courses"
import type { ProductWithCategory, Category } from "@/lib/supabase/products"

import ProductGrid from "./components/ProductGrid"

export const revalidate = 120

export const metadata: Metadata = {
  title: "Tienda | Liz Cabriales",
}

type SearchParams = {
  categoria?: string | string[]
  marca?: string | string[]
  abrasividad?: string | string[]
  search?: string | string[]
  precio_min?: string | string[]
  precio_max?: string | string[]
  ofertas?: string | string[]
}

function parsePrice(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function firstString(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string") return value
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string")
    return value[0]
  return undefined
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const categoryParam = firstString(sp.categoria)
  const brandParam = firstString(sp.marca)
  const abrasivityParam = firstString(sp.abrasividad)
  const search = firstString(sp.search)
  const priceMinParam = firstString(sp.precio_min)
  const priceMaxParam = firstString(sp.precio_max)
  const ofertasParam = firstString(sp.ofertas)

  // Cargamos el catálogo activo completo una sola vez; el filtrado y orden
  // se resuelven en el cliente para una experiencia instantánea.
  const [categoriesResult, brandsResult, allBrandsFullResult, productsResult, coursesResult, servicesResult] =
    await Promise.all([
      getCategories(),
      getBrands(),
      getAllBrandsFullCached(),
      getProducts(),
      getPublishedCourses(),
      getServicesCached(),
    ])

  if (categoriesResult.error || productsResult.error) {
    return (
      <main className="min-h-screen bg-white text-[#0a0a0a]">
        <div className="site-container pb-12">
          <h1 className="text-2xl font-semibold">Tienda</h1>
          <p className="mt-4 text-sm text-red-600">
            Ocurrió un error al cargar la tienda. Intenta de nuevo más tarde.
          </p>
        </div>
      </main>
    )
  }

  const categories = categoriesResult.data as Category[]
  const brands =
    brandsResult.error || !brandsResult.data ? [] : brandsResult.data
  const allBrandsFull =
    allBrandsFullResult.error || !allBrandsFullResult.data
      ? []
      : allBrandsFullResult.data
  const products = productsResult.data as ProductWithCategory[]

  const today = new Date().toISOString().split("T")[0] ?? ""
  const upcomingCourses = (coursesResult.data ?? [])
    .filter((c) => c.start_date >= today)
    .slice(0, 8)
  const activeServices = servicesResult.data ?? []

  const abrasivities: AbrasivityValue[] = abrasivityParam
    ? abrasivityParam
        .split(",")
        .filter(Boolean)
        .filter(isAbrasivityValue)
    : []

  const initialFilters = {
    categorySlugs: categoryParam ? categoryParam.split(",").filter(Boolean) : [],
    brands: brandParam ? brandParam.split(",").filter(Boolean) : [],
    abrasivities,
    search: search ?? "",
    priceMin: parsePrice(priceMinParam),
    priceMax: parsePrice(priceMaxParam),
    onSale: ofertasParam === "1" || ofertasParam === "true",
  }

  return (
    <main className="min-h-screen bg-ivory text-[#0a0a0a]">
      <div className="site-container pb-12">
        <ProductGrid
          products={products}
          categories={categories}
          brands={brands}
          brandsWithLogo={allBrandsFull}
          initialFilters={initialFilters}
          upcomingCourses={upcomingCourses}
          activeServices={activeServices}
          breadcrumbItems={[{ label: "Inicio", href: "/" }, { label: "Tienda" }]}
        />
      </div>
    </main>
  )
}

