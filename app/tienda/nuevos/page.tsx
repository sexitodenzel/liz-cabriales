import type { Metadata } from "next"

import { getNewestProductsCached } from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"
import Breadcrumb from "@/components/shared/Breadcrumb"
import Eyebrow from "@/app/components/ui/Eyebrow"
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
          <h1 className="font-display text-[clamp(28px,4vw,44px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            <span className="text-gold-soft">Nuevos</span> Productos
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

        <header className="mb-10 space-y-3 border-b border-neutral-200 pb-6">
          <Eyebrow>Tienda</Eyebrow>
          <h1 className="font-display text-[clamp(28px,4vw,44px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            <span className="text-gold-soft">Nuevos</span> Productos
          </h1>
          <p className="max-w-2xl text-sm text-neutral-500">
            Lo más reciente en el catálogo profesional de Liz Cabriales.
          </p>
        </header>

        <ProductListingSection
          products={newestProducts}
          badge="Nuevo"
          emptyMessage="Aún no hay productos nuevos en el catálogo."
        />
      </div>
    </main>
  )
}
