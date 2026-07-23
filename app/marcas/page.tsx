import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumb from "@/components/shared/Breadcrumb"
import { getAllBrandsFullCached } from "@/lib/supabase/cache"

import BrandCard from "./BrandCard"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Marcas | Liz Cabriales",
  description:
    "Descubre las marcas profesionales que distribuimos en Liz Cabriales Studio.",
}

export default async function MarcasPage() {
  const brandsResult = await getAllBrandsFullCached()
  const brands =
    brandsResult.error || !brandsResult.data ? [] : brandsResult.data

  return (
    <main className="min-h-screen bg-ivory text-[#0a0a0a]">
      <div className="site-container pb-12">
        <Breadcrumb
          items={[{ label: "Inicio", href: "/" }, { label: "Marcas" }]}
          className="mb-4"
        />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-playfair),serif] text-[28px] font-medium leading-none text-[#111] sm:text-[32px]">
              Marcas
            </h1>
            <p className="mt-2 text-[14px] text-neutral-500">
              {brands.length === 0
                ? "Pronto verás aquí nuestras marcas."
                : `${brands.length} marca${brands.length === 1 ? "" : "s"} disponibles`}
            </p>
          </div>
          <Link
            href="/tienda"
            className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a6d26] transition-opacity hover:opacity-80"
          >
            Ver tienda
          </Link>
        </div>

        {brands.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/80 bg-white px-6 py-16 text-center">
            <p className="text-[14px] text-neutral-500">
              Aún no hay marcas registradas.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4">
            {brands.map((brand) => (
              <li key={brand.id}>
                <BrandCard brand={brand} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
