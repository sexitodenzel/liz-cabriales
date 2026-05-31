"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

type Props = {
  images: string[]
  alt: string
}

export default function ProductImageGallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const activeImage = images[activeIndex] ?? null
  const hasMultiple = images.length > 1

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const goToPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setActiveIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  useEffect(() => {
    if (!lightboxOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowLeft" && hasMultiple) goToPrev()
      if (e.key === "ArrowRight" && hasMultiple) goToNext()
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [lightboxOpen, closeLightbox, goToPrev, goToNext, hasMultiple])

  if (!activeImage) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-200" />
    )
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c]"
          aria-label="Ver imagen completa"
        >
          <Image
            key={activeImage}
            src={activeImage}
            alt={alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <span className="pointer-events-none absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </span>
          </span>
        </button>

        {hasMultiple ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  index === activeIndex
                    ? "border-[#c9a84c]"
                    : "border-transparent hover:border-neutral-300"
                }`}
                aria-label={`Ver imagen ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="presentation"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="fixed right-4 top-4 z-[120] flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a84c]/65 bg-black/55 text-2xl leading-none text-[#d8ba62] shadow-[0_0_0_1px_rgba(201,168,76,0.35),0_0_18px_rgba(201,168,76,0.38)] backdrop-blur-sm transition-all hover:scale-[1.04] hover:bg-black/70 hover:text-[#f0d989] hover:shadow-[0_0_0_1px_rgba(201,168,76,0.55),0_0_24px_rgba(201,168,76,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c]"
            aria-label="Cerrar"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
          >
            ×
          </button>

          {hasMultiple ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
                aria-label="Imagen anterior"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrev()
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
                aria-label="Imagen siguiente"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                ›
              </button>
            </>
          ) : null}

          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={activeImage}
              src={activeImage}
              alt={alt}
              width={1400}
              height={1400}
              className="h-auto max-h-[90vh] w-auto max-w-[92vw] object-contain"
              sizes="92vw"
              priority
            />
          </div>

          {hasMultiple ? (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
              {activeIndex + 1} / {images.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
