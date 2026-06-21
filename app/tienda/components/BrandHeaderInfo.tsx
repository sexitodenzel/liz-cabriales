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
  return (
    <section
      className="mb-5"
      aria-label={`Información de la marca ${brand.name}`}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-playfair),serif] text-[clamp(28px,3.6vw,42px)] font-medium leading-[1.1] tracking-[-0.01em] text-[#0a0a0a]">
            {brand.name}{" "}
            <span className="text-sm font-normal text-neutral-500 md:text-base">
              ({productCount} {productCount === 1 ? "producto" : "productos"})
            </span>
          </h2>

          {brand.description && brand.description.trim().length > 0 ? (
            <p className="mt-3 max-w-[640px] text-sm leading-relaxed text-neutral-600 md:text-[15px]">
              {brand.description}
            </p>
          ) : null}
        </div>

        {brand.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo_url}
            alt={brand.name}
            loading="lazy"
            className="h-[120px] w-auto max-w-[260px] shrink-0 object-contain md:h-[140px] md:max-w-[300px]"
          />
        ) : null}
      </div>
    </section>
  )
}
