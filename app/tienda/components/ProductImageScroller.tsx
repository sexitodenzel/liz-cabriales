"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"

type Props = {
  images: string[]
  alt: string
}

function dotClass(active: boolean): string {
  return active
    ? "h-2.5 w-2.5 rounded-full bg-neutral-900"
    : "h-1.5 w-1.5 rounded-full border border-neutral-900 bg-white"
}

export default function ProductImageScroller({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const figureRefs = useRef<Array<HTMLElement | null>>([])

  const markLoaded = useCallback((idx: number) => {
    setLoaded((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }))
  }, [])

  const imgClass = (idx: number) =>
    `object-cover transition-opacity duration-700 ease-out ${
      loaded[idx] ? "opacity-100" : "opacity-0"
    }`

  const setRef = useCallback((el: HTMLElement | null, idx: number) => {
    figureRefs.current[idx] = el
  }, [])

  useEffect(() => {
    if (images.length <= 1) return
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const centerY = window.innerHeight / 2
        let bestIdx = 0
        let bestDist = Infinity
        figureRefs.current.forEach((el, idx) => {
          if (!el) return
          const rect = el.getBoundingClientRect()
          const c = rect.top + rect.height / 2
          const dist = Math.abs(c - centerY)
          if (dist < bestDist) {
            bestDist = dist
            bestIdx = idx
          }
        })
        setActiveIndex(bestIdx)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [images.length])

  const scrollToImage = useCallback((idx: number) => {
    const el = figureRefs.current[idx]
    if (!el) return
    const rect = el.getBoundingClientRect()
    const targetY = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2
    window.scrollTo({ top: targetY, behavior: "smooth" })
  }, [])

  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full rounded-lg bg-neutral-100" />
  }

  return (
    <div className="mx-auto w-full max-w-xl md:max-w-none">
      {/* Mobile: horizontal swiper */}
      <div className="md:hidden">
        {images.length === 1 ? (
          <div className="relative aspect-square w-full overflow-hidden bg-white">
            <Image
              src={images[0]!}
              alt={alt}
              fill
              className={imgClass(0)}
              sizes="100vw"
              priority
              onLoad={() => markLoaded(0)}
            />
          </div>
        ) : (
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true, bulletActiveClass: "lc-bullet-active" }}
            spaceBetween={0}
            slidesPerView={1}
            className="lc-product-swiper"
          >
            {images.map((src, i) => (
              <SwiperSlide key={src}>
                <div className="relative aspect-square w-full overflow-hidden bg-white">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className={imgClass(i)}
                    sizes="100vw"
                    priority={i === 0}
                    onLoad={() => markLoaded(i)}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      {/* Desktop: vertical scroller con dots verticales estáticos junto a la primera imagen */}
      <div className="hidden md:flex md:gap-6">
        <div className="relative w-6 shrink-0">
          {images.length > 1 ? (
            <div
              className="sticky left-0 flex flex-col items-center gap-5"
              style={{ top: "50vh", transform: "translateY(-50%)" }}
            >
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToImage(idx)}
                  aria-label={`Ver imagen ${idx + 1}`}
                  className="flex h-5 w-5 cursor-pointer items-center justify-center"
                >
                  <span className={dotClass(idx === activeIndex)} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {images.map((src, idx) => (
            <figure
              key={src}
              ref={(el) => setRef(el, idx)}
              data-idx={idx}
              className="relative aspect-square w-full overflow-hidden bg-white"
              style={idx === images.length - 1 ? undefined : { marginBottom: "8px" }}
            >
              <Image
                src={src}
                alt={alt}
                fill
                className={imgClass(idx)}
                sizes="(max-width: 768px) 100vw, 45vw"
                priority={idx === 0}
                onLoad={() => markLoaded(idx)}
              />
            </figure>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .lc-product-swiper .swiper-pagination {
          position: static;
          margin-top: 12px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        .lc-product-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #fff;
          border: 1px solid #0a0a0a;
          opacity: 1;
        }
        .lc-product-swiper .swiper-pagination-bullet.lc-bullet-active {
          width: 6px;
          height: 6px;
          background: #0a0a0a;
          border-color: #0a0a0a;
        }
      `}</style>
    </div>
  )
}
