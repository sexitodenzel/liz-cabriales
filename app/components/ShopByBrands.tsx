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
   hairline dorado; logos a color completo. */

export default function ShopByBrands({ brands }: ShopByBrandsProps) {
  if (brands.length === 0) return null

  return (
    <section className="py-6 md:py-8" aria-labelledby="shop-by-brands-title">
      <h2 id="shop-by-brands-title" className="sr-only">
        Marcas que distribuimos
      </h2>

      <InView>
        <Marquee speed={80} pauseOnHover gap="0px" className="py-1.5 md:py-2">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
              className="group flex h-[52px] w-[76px] shrink-0 items-center justify-center border-r border-gold-soft/30 px-1.5 sm:h-[62px] sm:w-[96px] sm:px-2 md:h-[68px] md:w-[108px] md:px-2"
              aria-label={`Ver productos de ${brand.name}`}
            >
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="max-h-[42px] w-auto max-w-[60px] rounded-md object-contain transition-opacity duration-300 group-hover:opacity-80 sm:max-h-[52px] sm:max-w-[76px] md:max-h-[58px] md:max-w-[90px]"
                  loading="lazy"
                />
              ) : (
                <span className="text-center text-[11px] font-medium text-ink-soft transition-colors group-hover:text-ink sm:text-sm">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </Marquee>
      </InView>

      <InView delay={0.12}>
        <div className="mt-6 flex justify-center md:mt-8">
          <Link
            href="/marcas"
            className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-neutral-800"
          >
            Conoce nuestras marcas
          </Link>
        </div>
      </InView>
    </section>
  )
}
