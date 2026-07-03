import Link from "next/link"

import type { HomeBrandItem } from "@/lib/supabase/cache"
import { Marquee } from "@/app/components/ui/motion/marquee"
import SectionHeader from "@/app/components/ui/SectionHeader"

type ShopByBrandsProps = {
  brands: HomeBrandItem[]
}

/* Marquee de marcas aliadas: todas al mismo tamaño y velocidad,
   sin destacar ninguna (acuerdo comercial: cero favoritismos). */

export default function ShopByBrands({ brands }: ShopByBrandsProps) {
  if (brands.length === 0) return null

  return (
    <section className="py-12 md:py-16" aria-labelledby="shop-by-brands-title">
      <SectionHeader
        id="shop-by-brands-title"
        eyebrow="Distribuidora oficial"
        title={
          <>
            Marcas <em>Disponibles</em>
          </>
        }
        description="Explora nuestras marcas aliadas y entra directo a su selección dentro de tienda."
      />

      <Marquee speed={60} pauseOnHover gap="1.5rem" className="py-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
            className="group flex h-[120px] w-[220px] shrink-0 items-center justify-center bg-transparent px-6 py-4 transition-opacity duration-200 hover:opacity-100"
            aria-label={`Ver productos de ${brand.name}`}
          >
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="max-h-[88px] w-auto max-w-full object-contain opacity-90 transition-all duration-200 group-hover:opacity-100"
                loading="lazy"
              />
            ) : (
              <span className="text-center text-sm font-medium text-ink-soft">
                {brand.name}
              </span>
            )}
          </Link>
        ))}
      </Marquee>
    </section>
  )
}
