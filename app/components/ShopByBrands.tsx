import Link from "next/link"

import type { HomeBrandItem } from "@/lib/supabase/cache"
import { Marquee } from "@/app/components/ui/motion/marquee"
import InView from "@/app/components/ui/motion/in-view"

type ShopByBrandsProps = {
  brands: HomeBrandItem[]
}

/* Marquee de marcas aliadas: todas al mismo tamaño y velocidad,
   sin destacar ninguna (acuerdo comercial: cero favoritismos).
   Estilo editorial "logos desnudos": sin tarjeta, separados por un
   hairline dorado; grayscale que se colorea al hover. */

export default function ShopByBrands({ brands }: ShopByBrandsProps) {
  if (brands.length === 0) return null

  return (
    <section className="py-6 md:py-8" aria-labelledby="shop-by-brands-title">
      <InView>
        <header className="mb-4 text-center md:mb-5">
          <h2
            id="shop-by-brands-title"
            className="text-[13px] font-medium uppercase tracking-[0.28em] text-ink-soft"
          >
            Distribuidora oficial
          </h2>
          <div className="mx-auto mt-2.5 h-px w-12 bg-gold-soft" aria-hidden />
        </header>
      </InView>

      <InView delay={0.12}>
        <Marquee speed={45} pauseOnHover gap="0px" className="py-2">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
              className="group flex h-[64px] w-[190px] shrink-0 items-center justify-center border-r border-gold-soft/30 px-8"
              aria-label={`Ver productos de ${brand.name}`}
            >
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="max-h-[56px] w-auto max-w-[130px] object-contain opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                  loading="lazy"
                />
              ) : (
                <span className="text-center text-sm font-medium text-ink-soft transition-colors group-hover:text-ink">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </Marquee>
      </InView>
    </section>
  )
}
