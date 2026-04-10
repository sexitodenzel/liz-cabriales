"use client"

import { useState, useCallback } from "react"
import Link from "next/link"

type FeaturedKit = {
  id: number
  name: string
  category: string
  currentPrice: string
  originalPrice: string
  discountLabel: string
  image: string
  imageHover: string
}

const featuredKits: FeaturedKit[] = [
  {
    id: 1,
    name: "Luxury Kit",
    category: "gel nail polish",
    currentPrice: "$899 MXN",
    originalPrice: "$1,199 MXN",
    discountLabel: "25% OFF",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop",
    imageHover:
      "https://images.unsplash.com/photo-1583001809873-a128495da465?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Classic Kit",
    category: "gel nail polish",
    currentPrice: "$699 MXN",
    originalPrice: "$899 MXN",
    discountLabel: "25% OFF",
    image:
      "https://images.unsplash.com/photo-1596704017254-9756e98c3c54?w=400&h=400&fit=crop",
    imageHover:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Starter Kit",
    category: "gel nail polish",
    currentPrice: "$499 MXN",
    originalPrice: "$649 MXN",
    discountLabel: "25% OFF",
    image:
      "https://images.unsplash.com/photo-1583001809873-a128495da465?w=400&h=400&fit=crop",
    imageHover:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Nail Art Kit",
    category: "gel nail polish",
    currentPrice: "$599 MXN",
    originalPrice: "$799 MXN",
    discountLabel: "25% OFF",
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=400&fit=crop",
    imageHover:
      "https://images.unsplash.com/photo-1596704017254-9756e98c3c54?w=400&h=400&fit=crop",
  },
]

const TOTAL = featuredKits.length
const MAX_INDEX = TOTAL - 2

export default function FeaturedKits() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const handleScroll = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left" && currentIndex === 0) return
      if (direction === "right" && currentIndex >= MAX_INDEX) return

      setCurrentIndex((prev) =>
        direction === "left"
          ? Math.max(0, prev - 1)
          : Math.min(MAX_INDEX, prev + 1)
      )
    },
    [currentIndex]
  )

  const canGoLeft = currentIndex > 0
  const canGoRight = currentIndex < MAX_INDEX

  return (
    <section className="py-16">
      <div className="max-w-[1400px] mx-auto px-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">

        {/* Hero izquierdo */}
        <div className="flex flex-col lg:w-1/3">
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-black text-white">
            <img
              src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=700&fit=crop"
              alt="Kits de uñas Liz Cabriales"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center gap-8 p-8">
              <h2 className="text-3xl lg:text-5xl font-semibold leading-tight">
                Todo lo que necesitas en un kit
              </h2>
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center px-11 py-3.5 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-900 transition-all duration-200 max-w-[260px] w-full"
              >
                Descubrir todo
              </Link>
            </div>
          </div>
        </div>

        {/* Carrusel */}
        <div className="relative flex flex-col lg:w-2/3">
          <div
            className="flex-1 overflow-x-auto pb-4 lg:overflow-x-hidden"
            style={{
              maskImage: currentIndex > 0
                ? "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 98%)"
                : "linear-gradient(to right, black 0%, black 95%, transparent 98%)",
              WebkitMaskImage: currentIndex > 0
                ? "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 98%)"
                : "linear-gradient(to right, black 0%, black 95%, transparent 98%)",
            }}
          >
            <div
              className="flex h-full gap-4 transition-all duration-500 ease-in-out lg:overflow-visible"
              style={{
                transform: `translateX(calc(-${currentIndex} * (22vw + 1rem)))`,
              }}
            >
              {featuredKits.map((kit) => (
                <article
                  key={kit.id}
                  className="flex min-w-[70%] lg:min-w-0 flex-shrink-0 flex-col lg:w-[22vw] transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* Imagen */}
                  <div
                    className="relative w-full overflow-hidden bg-gray-50"
                    onMouseEnter={() => setHoveredId(kit.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <Link href="/tienda" className="block">
                      <div className="relative aspect-square w-full">
                        <img
                          src={kit.image}
                          alt={kit.name}
                          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                            hoveredId === kit.id ? "opacity-0" : "opacity-100"
                          }`}
                        />
                        <img
                          src={kit.imageHover}
                          alt=""
                          aria-hidden
                          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                            hoveredId === kit.id ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </div>
                    </Link>
                    <div className="absolute left-3 top-3 rounded-full bg-[#C9A84C] px-3 py-1 text-xs font-medium text-black">
                      {kit.discountLabel}
                    </div>
                    <Link
                      href="/favoritos"
                      aria-label="Añadir a favoritos"
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center text-black"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                        />
                      </svg>
                    </Link>
                  </div>

                  {/* Texto y botón */}
                  <div className="flex flex-1 flex-col pt-3">
                    <Link href="/tienda" className="block">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        {kit.category}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-gray-900">
                        {kit.name}
                      </h3>
                    </Link>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xs text-gray-400 line-through">
                        {kit.originalPrice}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {kit.currentPrice}
                      </span>
                    </div>
                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        className="w-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-black hover:text-white"
                      >
                        Añadir al carrito
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canGoLeft}
            className={`absolute left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-gray-900 shadow-md transition hover:bg-white hover:text-[#C9A84C] outline-none focus:outline-none focus-visible:outline-none lg:flex ${
              !canGoLeft ? "lg:invisible" : ""
            }`}
            aria-label="Ver kits anteriores"
          >
            <span className="sr-only">Anterior</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canGoRight}
            className={`absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-gray-900 shadow-md transition hover:bg-white hover:text-[#C9A84C] outline-none focus:outline-none focus-visible:outline-none lg:flex ${
              !canGoRight ? "cursor-not-allowed opacity-30" : ""
            }`}
            aria-label="Ver más kits"
          >
            <span className="sr-only">Siguiente</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="m10 6-1.41 1.41L13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor" />
            </svg>
          </button>
        </div>

      </div>
      </div>
    </section>
  )
}
