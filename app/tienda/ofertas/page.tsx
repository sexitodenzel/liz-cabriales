import type { Metadata } from "next"

import { getOnSaleProductsCached } from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"
import Breadcrumb from "@/components/shared/Breadcrumb"
import Eyebrow from "@/app/components/ui/Eyebrow"
import ProductListingSection from "../components/ProductListingSection"

export const revalidate = 120

export const metadata: Metadata = {
  title: "Ofertas | Liz Cabriales",
  description: "Productos en oferta de Liz Cabriales.",
}

export default async function OfertasPage() {
  const { data: products, error } = await getOnSaleProductsCached()

  if (error) {
    return (
      <main className="min-h-screen bg-ivory text-[#0a0a0a]">
        <div className="site-container pt-5 pb-12">
          <h1 className="font-display text-[clamp(28px,4vw,44px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            <span className="text-gold-soft">Ofertas</span>
          </h1>
          <p className="mt-4 text-sm text-red-600">
            Ocurrió un error al cargar las ofertas. Intenta de nuevo más tarde.
          </p>
        </div>
      </main>
    )
  }

  const onSale = (products ?? []) as ProductWithCategory[]

  return (
    <main className="min-h-screen bg-ivory text-[#0a0a0a]">
      <div className="site-container pt-5 pb-12">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Tienda", href: "/tienda" },
            { label: "Ofertas" },
          ]}
        />

        <header className="mb-10 space-y-3 border-b border-neutral-200 pb-6">
          <Eyebrow>Tienda</Eyebrow>
          <div className="flex flex-wrap items-end gap-3">
            <h1 className="font-display text-[clamp(28px,4vw,44px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
              <span className="text-gold-soft">Ofertas</span> vigentes
            </h1>
            {onSale.length > 0 && (
              <span className="rounded-full bg-[#c6a75e] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                {onSale.length} producto{onSale.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="max-w-2xl text-sm text-neutral-500">
            Productos con descuento por tiempo limitado. Aprovecha mientras
            haya inventario.
          </p>
        </header>

        <ProductListingSection
          products={onSale}
          emptyMessage="Por ahora no hay productos en oferta. ¡Vuelve pronto!"
        />
      </div>
    </main>
  )
}
