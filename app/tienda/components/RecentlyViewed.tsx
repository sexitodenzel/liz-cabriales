"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

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
    <section className="mt-16">
      <h2 className="text-xl font-semibold">Vistos recientemente</h2>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => {
          const brand = item.brand ?? "Sin marca"
          const initials = brand
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase())
            .join("")

          return (
            <Link
              key={item.slug}
              href={`/tienda/${item.slug}`}
              className="group w-44 flex-none overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg"
            >
              <div className="relative bg-neutral-100">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-neutral-100 text-2xl font-semibold text-neutral-400">
                    {initials || "LC"}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                  {brand}
                </p>
                <h3 className="line-clamp-2 text-sm font-medium text-[#0a0a0a]">
                  {item.name}
                </h3>
                <p className="mt-1 text-base font-semibold text-[#C9A84C]">
                  {formatPrice(item.base_price)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
