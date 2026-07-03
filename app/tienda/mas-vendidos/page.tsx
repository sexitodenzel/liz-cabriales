import type { Metadata } from "next"

import { getBestSellersCached } from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"
import Breadcrumb from "@/components/shared/Breadcrumb"
import ProductListingSection from "../components/ProductListingSection"

export const revalidate = 120

export const metadata: Metadata = {
  title: "Best Sellers | Liz Cabriales",
}

export default async function BestSellersPage() {
  const { data: products, error } = await getBestSellersCached()

  if (error) {
    return (
      <main className="min-h-screen bg-white text-[#0a0a0a]">
        <div className="site-container pt-5 pb-12">
          <h1 className="text-2xl font-semibold">
            <span className="text-[#c9a84c]">Best</span>{" "}
            <span className="text-[#0a0a0a]">Sellers</span>
          </h1>
          <p className="mt-4 text-sm text-red-600">
            Ocurrió un error al cargar los productos. Intenta de nuevo más tarde.
          </p>
        </div>
      </main>
    )
  }

  const bestSellers = (products ?? []) as ProductWithCategory[]

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="site-container pt-5 pb-12">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Tienda", href: "/tienda" },
            { label: "Best sellers" },
          ]}
        />

        <header className="mb-10 space-y-3 border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">
            <span className="text-[#c9a84c]">Best</span>{" "}
            <span className="text-[#0a0a0a]">Sellers</span>
          </h1>
          <p className="max-w-2xl text-sm text-neutral-500">
            Los productos favoritos de nuestra comunidad de profesionales.
          </p>
        </header>

        <ProductListingSection
          products={bestSellers}
          badge="Best seller"
          emptyMessage="Aún no hay productos marcados como best sellers."
        />
      </div>
    </main>
  )
}
