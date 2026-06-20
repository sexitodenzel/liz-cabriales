"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  images: string[]
  alt: string
}

export default function ProductImageGallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })

  const activeImage = images[activeIndex] ?? null
  const hasMultiple = images.length > 1

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const goToPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setActiveIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomOrigin({ x, y })
  }, [])

  useEffect(() => {
    setIsHovering(false)
  }, [activeIndex])

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
        {/* Main image container */}
        <div
          className="group relative aspect-[4/5] w-full cursor-zoom-in select-none overflow-hidden rounded-lg bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c]"
          role="button"
          tabIndex={0}
          aria-label="Ver imagen completa"
          onClick={() => setLightboxOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setLightboxOpen(true)
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <Image
            key={activeImage}
            src={activeImage}
            alt={alt}
            fill
            className="object-cover transition-transform duration-200 ease-out"
            style={{
              transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
              transform: isHovering ? "scale(2.2)" : "scale(1)",
            }}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Magnifier icon */}
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
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
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </span>

          {/* Navigation arrows */}
          {hasMultiple ? (
            <>
              <button
                type="button"
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center text-black/70 transition-all duration-200 hover:text-black md:opacity-0 md:group-hover:opacity-100 sm:left-3"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrev()
                }}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Imagen siguiente"
                className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center text-black/70 transition-all duration-200 hover:text-black md:opacity-0 md:group-hover:opacity-100 sm:right-3"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>

              {/* Dot indicators */}
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                      i === activeIndex ? "bg-black" : "bg-[#ccc]"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Thumbnails */}
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

      {/* Lightbox */}
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
