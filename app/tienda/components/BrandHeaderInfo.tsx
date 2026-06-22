"use client"

import type { HomeBrandItem } from "@/lib/supabase/cache"

type BrandHeaderInfoProps = {
  brand: HomeBrandItem
  productCount: number
}

export default function BrandHeaderInfo({
  brand,
  productCount,
}: BrandHeaderInfoProps) {
  const description = brand.description?.trim() ?? ""
  const hasDescription = description.length > 0

  return (
    <section
      className="mb-5"
      aria-label={`Información de la marca ${brand.name}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 md:items-center">
        <h2 className="col-span-2 font-[family-name:var(--font-playfair),serif] text-[clamp(28px,3.6vw,42px)] font-medium leading-[1.1] tracking-[-0.01em] text-[#0a0a0a] md:col-span-1">
          {brand.name}{" "}
          <span className="text-sm font-normal text-neutral-500 md:text-base">
            ({productCount} {productCount === 1 ? "producto" : "productos"})
          </span>
        </h2>

        {hasDescription ? (
          <p className="col-start-1 row-start-2 min-w-0 text-sm leading-relaxed text-neutral-600 md:max-w-[640px] md:text-[15px]">
            {description}
          </p>
        ) : null}

        {brand.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo_url}
            alt={brand.name}
            loading="lazy"
            className={`col-start-2 h-[110px] w-auto max-w-[130px] shrink-0 self-start object-contain md:h-[140px] md:max-w-[300px] md:row-span-2 md:self-center ${
              hasDescription ? "row-start-2 md:row-start-1" : "row-start-1"
            }`}
          />
        ) : null}
      </div>
    </section>
  )
}
