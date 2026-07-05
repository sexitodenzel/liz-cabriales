import type { Metadata } from "next"

import { getNewestProductsCached } from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"
import Breadcrumb from "@/components/shared/Breadcrumb"
import ProductListingSection from "../components/ProductListingSection"

export const revalidate = 120

export const metadata: Metadata = {
  title: "Nuevos Productos | Liz Cabriales",
}

export default async function NewProductsPage() {
  const { data: products, error } = await getNewestProductsCached()

  if (error) {
    return (
      <main className="min-h-screen bg-ivory text-[#0a0a0a]">
        <div className="site-container pt-5 pb-12">
          <h1 className="text-2xl font-semibold">
            <span className="text-[#c9a84c]">Nuevos</span>{" "}
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
    <main className="min-h-screen bg-ivory text-[#0a0a0a]">
      <div className="site-container pt-5 pb-12">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Tienda", href: "/tienda" },
            { label: "Nuevos productos" },
          ]}
        />

        <ProductListingSection
          products={newestProducts}
          badge="Nuevo"
          emptyMessage="Aún no hay productos nuevos en el catálogo."
        />
      </div>
    </main>
  )
}
