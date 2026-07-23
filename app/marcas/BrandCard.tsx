import Link from "next/link"
import Image from "next/image"

import type { HomeBrandItem } from "@/lib/supabase/cache"
import { TiltCard } from "@/app/components/ui/motion/tilt-card"

type BrandCardProps = {
  brand: HomeBrandItem
}

export default function BrandCard({ brand }: BrandCardProps) {
  const href = `/tienda?marca=${encodeURIComponent(brand.name)}`
  const initials = brand.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")

  return (
    <article className="group flex h-full flex-col">
      <TiltCard
        max={8}
        glare={false}
        className="relative aspect-square w-full rounded-xl bg-neutral-50"
      >
        <Link
          href={href}
          className="relative flex h-full w-full items-center justify-center p-6 sm:p-8"
          aria-label={`Ver productos de ${brand.name}`}
        >
          {brand.logo_url ? (
            <Image
              src={brand.logo_url}
              alt={brand.name}
              fill
              className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-[1.04] sm:p-8"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-semibold uppercase tracking-wide text-neutral-400 ring-1 ring-neutral-200 sm:h-24 sm:w-24 sm:text-3xl"
            >
              {initials || brand.name.charAt(0)}
            </span>
          )}
        </Link>
      </TiltCard>

      <div className="pt-2">
        <h2 className="line-clamp-2 text-xs font-medium leading-snug text-[#0a0a0a] sm:text-sm">
          <Link href={href} className="hover:text-[#a8862f]">
            {brand.name}
          </Link>
        </h2>
        {brand.description ? (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-neutral-500 sm:text-xs">
            {brand.description}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500 sm:text-xs sm:tracking-[0.18em]">
            Ver productos
          </p>
        )}
      </div>
    </article>
  )
}
