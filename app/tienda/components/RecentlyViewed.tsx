"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, ShoppingBag } from "lucide-react"
import SectionCarousel from "./SectionCarousel"
import { storeIconButtonClassName } from "./store-button-styles"
import { TiltCard } from "@/app/components/ui/motion/tilt-card"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"

const STORAGE_KEY = "lc:recently-viewed"
const MAX_STORED = 12
const MAX_SHOWN = 8

export type RecentlyViewedItem = {
  slug: string
  name: string
  image: string | null
  base_price: number
  brand: string | null
}

type Props = {
  /** Si se omite, solo muestra el historial sin registrar una visita nueva. */
  current?: RecentlyViewedItem
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function readStored(): RecentlyViewedItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is RecentlyViewedItem =>
        item &&
        typeof item.slug === "string" &&
        typeof item.name === "string" &&
        typeof item.base_price === "number"
    )
  } catch {
    return []
  }
}

export default function RecentlyViewed({ current }: Props) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const { toggle, has, hydrated: wishlistHydrated } = useWishlist()

  useEffect(() => {
    const stored = readStored()

    if (!current) {
      setItems(stored.slice(0, MAX_SHOWN))
      return
    }

    const next = [current, ...stored.filter((item) => item.slug !== current.slug)].slice(
      0,
      MAX_STORED
    )

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignorar si localStorage no esta disponible.
    }

    setItems(next.filter((item) => item.slug !== current.slug).slice(0, MAX_SHOWN))
  }, [current])

  if (items.length === 0) return null

  return (
    <SectionCarousel title="Vistos recientemente">
      {items.map((item) => {
          const brand = item.brand ?? "Sin marca"
          const initials = brand
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase())
            .join("")

          const wishlisted = wishlistHydrated && has(item.slug)

          return (
            <article
              key={item.slug}
              className="group flex h-full w-64 flex-none flex-col"
            >
              <TiltCard
                max={8}
                glare={false}
                className="relative aspect-square w-full rounded-none bg-neutral-50"
              >
                <Link
                  href={`/tienda/${item.slug}`}
                  className="relative block h-full w-full"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-neutral-400">
                      {initials || "LC"}
                    </div>
                  )}
                </Link>
              </TiltCard>
              <div className="pt-2">
                <h3 className="line-clamp-2 text-xs font-medium leading-snug text-[#0a0a0a] sm:text-sm">
                  <Link href={`/tienda/${item.slug}`}>{item.name}</Link>
                </h3>
                <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500 sm:text-xs sm:tracking-[0.18em]">
                  {brand}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#C9A84C] sm:text-base">
                    {formatPrice(item.base_price)}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggle(item.slug)}
                      aria-label={
                        wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"
                      }
                      className={storeIconButtonClassName}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors sm:h-[18px] sm:w-[18px]${
                          wishlisted ? " fill-neutral-900 text-neutral-900" : ""
                        }`}
                      />
                    </button>
                    <Link
                      href={`/tienda/${item.slug}`}
                      aria-label="Ver producto"
                      className={storeIconButtonClassName}
                    >
                      <ShoppingBag
                        className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
    </SectionCarousel>
  )
}
