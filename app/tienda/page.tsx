import type { Metadata } from "next"

import {
  getBrands,
  getCategories,
  getProducts,
  type ProductWithCategory,
  type Category,
} from "@/lib/supabase/products"

import ProductGrid from "./components/ProductGrid"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Tienda | Liz Cabriales",
}

type SearchParams = {
  categoria?: string | string[]
  marca?: string | string[]
  search?: string | string[]
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
  const categorySlug = firstString(sp.categoria)
  const brandParam = firstString(sp.marca)
  const search = firstString(sp.search)

  const [categoriesResult, brandsResult, productsResult] = await Promise.all([
    getCategories(),
    getBrands(),
    getProducts({
      categorySlug,
      brand: brandParam,
      search,
    }),
  ])

  console.log('categories error:', JSON.stringify(categoriesResult.error))
  console.log('products error:', JSON.stringify(productsResult.error))

  if (categoriesResult.error || productsResult.error) {
    return (
      <main className="min-h-screen bg-white text-[#0a0a0a]">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
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
  const products = productsResult.data as ProductWithCategory[]

  const initialFilters = {
    categorySlug: categorySlug ?? null,
    brands: brandParam ? brandParam.split(",").filter(Boolean) : [],
    search: search ?? "",
  }

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <header className="mb-10 space-y-3 border-b border-neutral-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            TIENDA
          </p>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] md:text-3xl">
            Distribuidores oficiales de las mejores marcas del medio
          </h1>
        </header>

        <ProductGrid
          products={products}
          categories={categories}
          brands={brands}
          initialFilters={initialFilters}
        />
      </div>
    </main>
  )
}

