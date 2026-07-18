"use client"

import { useState } from "react"
import SmoothImage from "@/app/components/shared/SmoothImage"
import ImageLightbox from "@/app/components/shared/ImageLightbox"

const HERO_IMAGES = [
  "https://picsum.photos/seed/academia-hero-a/1200/900",
  "https://picsum.photos/seed/academia-hero-b/700/500",
  "https://picsum.photos/seed/academia-hero-c/700/500",
]

export default function AcademiaHero() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <>
      {/* Encabezado solo desktop (en móvil vive en la hoja bajo la foto). */}
      <header className="mb-5 hidden lg:block">
        <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(30px,5vw,46px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
          Academia
        </h1>
      </header>

      {/* Galería: móvil = foto full-bleed; desktop = collage. */}
      <section
        className="relative max-lg:mb-0 lg:mb-10"
        aria-label="Galería de la academia"
      >
        <div className="relative -mx-[var(--site-px)] w-[calc(100%+2*var(--site-px))] max-w-none lg:hidden">
          <button
            type="button"
            onClick={() => openLightbox(0)}
            aria-label="Ampliar galería"
            className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden"
          >
            <SmoothImage
              src={HERO_IMAGES[0]}
              alt="Academia Liz Cabriales"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </button>
          <button
            type="button"
            onClick={() => openLightbox(0)}
            aria-label={`Ver galería, ${HERO_IMAGES.length} imágenes`}
            className="absolute bottom-11 right-4 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm"
          >
            1/{HERO_IMAGES.length}
          </button>
        </div>

        <div className="hidden gap-2 overflow-hidden rounded-2xl lg:grid lg:h-[440px] lg:grid-cols-3 lg:grid-rows-2">
          <button
            type="button"
            onClick={() => openLightbox(0)}
            aria-label="Ampliar galería"
            className="relative col-span-2 row-span-2 cursor-zoom-in overflow-hidden"
          >
            <SmoothImage
              src={HERO_IMAGES[0]}
              alt="Academia Liz Cabriales"
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              sizes="66vw"
              priority
            />
          </button>
          <button
            type="button"
            onClick={() => openLightbox(1)}
            aria-label="Ampliar galería"
            className="relative cursor-zoom-in overflow-hidden"
          >
            <SmoothImage
              src={HERO_IMAGES[1]}
              alt=""
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              sizes="33vw"
              priority
            />
          </button>
          <button
            type="button"
            onClick={() => openLightbox(2)}
            aria-label="Ampliar galería"
            className="relative cursor-zoom-in overflow-hidden"
          >
            <SmoothImage
              src={HERO_IMAGES[2]}
              alt=""
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              sizes="33vw"
              priority
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-0 hidden h-[34px] items-center rounded-full border border-neutral-200 bg-white/90 px-2.5 text-[11px] font-medium tracking-wide text-neutral-500 backdrop-blur transition-colors hover:bg-white hover:text-neutral-700 lg:inline-flex"
        >
          Ver todas las imágenes
        </button>
      </section>

      {/* Móvil: hoja full-width que solapa la foto con bordes superiores redondeados. */}
      <div className="relative z-10 -mx-[var(--site-px)] -mt-8 w-[calc(100%+2*var(--site-px))] max-w-none overflow-hidden rounded-t-[1.75rem] bg-ivory px-[var(--site-px)] pt-6 lg:hidden">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-playfair),serif] text-[32px] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            Academia
          </h1>
        </header>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={HERO_IMAGES}
          startIndex={lightboxIndex}
          alt="Academia Liz Cabriales"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
