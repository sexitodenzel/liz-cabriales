import Link from "next/link"

import type { HomeBrandItem } from "@/lib/supabase/cache"

type ShopByBrandsProps = {
  brands: HomeBrandItem[]
}

export default function ShopByBrands({ brands }: ShopByBrandsProps) {
  if (brands.length === 0) return null

  return (
    <section className="bg-white pt-14 text-black" aria-labelledby="shop-by-brands-title">
      <div>
        <header className="mb-10 max-w-[720px]">
          <h2
            id="shop-by-brands-title"
            className="mb-[18px] mt-3.5 font-[family-name:var(--font-playfair),serif] text-[clamp(36px,4.4vw,56px)] font-medium leading-[1.05] tracking-[-0.01em] text-black"
          >
            Marcas{" "}
            <em className="font-medium italic text-[#a8862f]">
              Disponibles
            </em>
          </h2>
          <div className="mb-[18px] h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
          <p className="max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
            Explora nuestras marcas aliadas y entra directo a su selección dentro de tienda.
          </p>
        </header>

        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2 border-y border-neutral-200 py-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
                className="group flex h-[84px] w-[172px] shrink-0 items-center justify-center rounded-xl border border-transparent bg-transparent px-5 py-3 transition-colors duration-200 hover:border-neutral-200 hover:bg-neutral-50"
                aria-label={`Ver productos de ${brand.name}`}
              >
                {brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="max-h-[44px] w-auto max-w-full object-contain opacity-90 transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-center text-sm font-medium text-neutral-700">
                    {brand.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
