"use client"

import { useState, useCallback } from "react"
import Link from "next/link"

type FeaturedColor = {
  id: number
  name: string
  category: string
  price: string
  imageSeed: number
  imageHoverSeed: number
}

const featuredColors: FeaturedColor[] = [
  {
    id: 1,
    name: "Rosa Nude Cremoso",
    category: "esmalte semipermanente",
    price: "$180 MXN",
    imageSeed: 21,
    imageHoverSeed: 31,
  },
  {
    id: 2,
    name: "Rojo Clásico",
    category: "esmalte semipermanente",
    price: "$180 MXN",
    imageSeed: 22,
    imageHoverSeed: 32,
  },
  {
    id: 3,
    name: "Negro Intenso",
    category: "esmalte semipermanente",
    price: "$180 MXN",
    imageSeed: 23,
    imageHoverSeed: 33,
  },
  {
    id: 4,
    name: "Beige Natural",
    category: "esmalte semipermanente",
    price: "$180 MXN",
    imageSeed: 24,
    imageHoverSeed: 34,
  },
  {
    id: 5,
    name: "Lila Pastel",
    category: "esmalte semipermanente",
    price: "$180 MXN",
    imageSeed: 25,
    imageHoverSeed: 35,
  },
]

const TOTAL = featuredColors.length
const MAX_INDEX = TOTAL - 2

export default function FeaturedColors() {
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
              src="https://picsum.photos/400/600?random=20"
              alt="Colores de esmaltes Liz Cabriales"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center gap-8 p-8">
              <h2 className="text-3xl lg:text-5xl font-semibold leading-tight">
                Descubre más de 100 colores
              </h2>
              <Link
                href="/tienda?categoria=esmaltes-y-geles"
                className="inline-flex items-center justify-center px-11 py-3.5 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-900 transition-all duration-200 max-w-[260px] w-full"
              >
                Ver colores
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
              {featuredColors.map((color) => (
                <article
                  key={color.id}
                  className="flex min-w-[70%] lg:min-w-0 flex-shrink-0 flex-col lg:w-[22vw] transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* Imagen */}
                  <div
                    className="relative w-full overflow-hidden bg-gray-50"
                    onMouseEnter={() => setHoveredId(color.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <Link href="/tienda" className="block">
                      <div className="relative aspect-square w-full">
                        <img
                          src={`https://picsum.photos/300/300?random=${color.imageSeed}`}
                          alt={color.name}
                          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                            hoveredId === color.id ? "opacity-0" : "opacity-100"
                          }`}
                        />
                        <img
                          src={`https://picsum.photos/300/300?random=${color.imageHoverSeed}`}
                          alt=""
                          aria-hidden
                          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                            hoveredId === color.id ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </div>
                    </Link>
                    <div className="absolute left-3 top-3 rounded-full bg-[#C9A84C] px-3 py-1 text-xs font-medium text-black">
                      NEW
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
                        {color.category}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-gray-900">
                        {color.name}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {color.price}
                    </p>
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
            aria-label="Ver colores anteriores"
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
            aria-label="Ver más colores"
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
