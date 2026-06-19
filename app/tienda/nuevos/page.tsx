import type { Metadata } from "next"

import { getNewestProductsCached } from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"
import Breadcrumb from "@/components/shared/Breadcrumb"
import ProductCard from "../components/ProductCard"

export const revalidate = 120

export const metadata: Metadata = {
  title: "Nuevos Productos | Liz Cabriales",
}

export default async function NewProductsPage() {
  const { data: products, error } = await getNewestProductsCached()

  if (error) {
    return (
      <main className="min-h-screen bg-white text-[#0a0a0a]">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <h1 className="text-2xl font-semibold">
            <span className="text-[#C6A75E]">Nuevos</span>{" "}
            <span className="text-[#0a0a0a]">Productos</span>
          </h1>
          <p className="mt-4 text-sm text-red-600">
            Ocurrió un error al cargar los productos. Intenta de nuevo más tarde.
          </p>
        </div>
      </main>
    )
  }

  const newestProducts = (products ?? []) as ProductWithCategory[]

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Tienda", href: "/tienda" },
            { label: "Nuevos productos" },
          ]}
        />

        <header className="mb-10 space-y-3 border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">
            <span className="text-[#C6A75E]">Nuevos</span>{" "}
            <span className="text-[#0a0a0a]">Productos</span>
          </h1>
          <p className="max-w-2xl text-sm text-neutral-500">
            Explora las novedades que hemos incorporado recientemente a nuestro
            catálogo.
          </p>
        </header>

        {newestProducts.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-[#0a0a0a]">
              Aún no hay productos nuevos en el catálogo.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
