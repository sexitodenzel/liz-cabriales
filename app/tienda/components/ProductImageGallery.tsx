"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

type Props = {
  images: string[]
  alt: string
}

export default function ProductImageGallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const [leavingImage, setLeavingImage] = useState<string | null>(null)
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next")

  const activeImage = images[activeIndex] ?? null
  const hasMultiple = images.length > 1
  const slideDurationMs = 280

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const changeImage = useCallback(
    (nextIndex: number, direction: "next" | "prev") => {
      if (nextIndex === activeIndex) return
      if (activeImage) setLeavingImage(activeImage)
      setSlideDirection(direction)
      setActiveIndex(nextIndex)
    },
    [activeImage, activeIndex]
  )

  const goToPrev = useCallback(() => {
    const nextIndex = activeIndex <= 0 ? images.length - 1 : activeIndex - 1
    changeImage(nextIndex, "prev")
  }, [activeIndex, changeImage, images.length])

  const goToNext = useCallback(() => {
    const nextIndex = activeIndex >= images.length - 1 ? 0 : activeIndex + 1
    changeImage(nextIndex, "next")
  }, [activeIndex, changeImage, images.length])

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
    if (!leavingImage) return
    const timeoutId = window.setTimeout(
      () => setLeavingImage(null),
      slideDurationMs
    )
    return () => window.clearTimeout(timeoutId)
  }, [leavingImage, slideDurationMs])

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
          {leavingImage ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                animation: `${slideDirection === "next" ? "productSlideOutLeft" : "productSlideOutRight"} ${slideDurationMs}ms ease`,
              }}
            >
              <Image
                src={leavingImage}
                alt={alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          ) : null}

          <div
            className="absolute inset-0"
            style={
              leavingImage
                ? {
                    animation: `${slideDirection === "next" ? "productSlideInRight" : "productSlideInLeft"} ${slideDurationMs}ms ease`,
                  }
                : undefined
            }
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
          </div>

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
              <div className="pointer-events-none absolute right-3 top-3 z-10 px-2 py-1 text-xs font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                {activeIndex + 1}/{images.length}
              </div>

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
                onClick={() =>
                  changeImage(index, index > activeIndex ? "next" : "prev")
                }
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
            className="fixed right-4 top-4 z-[120] flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            aria-label="Cerrar"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
          >
            <X className="h-6 w-6" strokeWidth={1.75} />
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

      <style jsx>{`
        @keyframes productSlideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes productSlideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes productSlideOutLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        @keyframes productSlideOutRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  )
}
