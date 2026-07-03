import Link from "next/link"

import type { HomeBrandItem } from "@/lib/supabase/cache"
import { Marquee } from "@/app/components/ui/motion/marquee"

type ShopByBrandsProps = {
  brands: HomeBrandItem[]
}

/* Marquee de marcas aliadas: todas al mismo tamaño y velocidad,
   sin destacar ninguna (acuerdo comercial: cero favoritismos). */

export default function ShopByBrands({ brands }: ShopByBrandsProps) {
  if (brands.length === 0) return null

  return (
    <section className="py-8 md:py-10" aria-labelledby="shop-by-brands-title">
      <header className="mb-6 text-center md:mb-8">
        <h2
          id="shop-by-brands-title"
          className="text-[13px] font-medium uppercase tracking-[0.28em] text-ink-soft"
        >
          Distribuidora oficial
        </h2>
        <div className="mx-auto mt-4 h-px w-12 bg-gold-soft" aria-hidden />
      </header>

      <Marquee speed={95} pauseOnHover gap="1rem" className="py-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
            className="group flex h-[120px] w-[180px] shrink-0 items-center justify-center rounded-2xl border border-ink/[0.06] bg-white/70 px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors duration-200 hover:border-gold-soft hover:bg-white"
            aria-label={`Ver productos de ${brand.name}`}
          >
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="max-h-[60px] w-auto max-w-[130px] object-contain opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
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
