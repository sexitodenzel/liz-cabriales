"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ProductWithCategory } from "@/lib/supabase/products"
import ProductCard from "./ProductCard"

type Props = {
  products: ProductWithCategory[]
}

export default function RelatedProductsCarousel({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" })
  }

  if (products.length === 0) return null

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">También te puede interesar</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Anterior"
            disabled={!canScrollLeft}
            onClick={() => scroll("left")}
            className="flex h-9 w-9 items-center justify-center bg-transparent text-[#0a0a0a] transition-colors hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            disabled={!canScrollRight}
            onClick={() => scroll("right")}
            className="flex h-9 w-9 items-center justify-center bg-transparent text-[#0a0a0a] transition-colors hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="mt-6 flex gap-5 overflow-x-auto pb-3"
      >
        {products.map((product) => (
          <div key={product.id} className="w-64 flex-none">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
