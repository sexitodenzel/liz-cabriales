"use client"

import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&fit=crop",
    eyebrow: "DISTRIBUIDORES OFICIALES",
    headline: "Todo lo que necesitas para ser profesional",
    ctaLabel: "Ver tienda",
    href: "/tienda",
    external: false,
  },
  {
    image:
      "https://images.unsplash.com/photo-1583001809873-a128495da465?w=1400&fit=crop",
    eyebrow: "15+ MARCAS PROFESIONALES",
    headline: "Las mejores marcas del medio, en un solo lugar",
    ctaLabel: "Ver productos",
    href: "/tienda",
    external: false,
  },
  {
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1400&fit=crop",
    eyebrow: "ACADEMIA LIZ CABRIALES",
    headline: "Fórmate con masters internacionales en Tampico",
    ctaLabel: "Contáctanos",
    href: "https://wa.me/528332183399",
    external: true,
  },
] as const

export default function HeroSlider() {
  return (
    <>
      <section className="h-[80vh] px-6">
        <div className="mx-auto h-full max-w-[1400px] overflow-hidden rounded-md">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 4000 }}
            loop={true}
            pagination={{ clickable: true }}
            navigation
            speed={900}
            className="h-full"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.eyebrow}>
                <div className="relative h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />

                  <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
                    <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
                      <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#C6A75E]">
                        {slide.eyebrow}
                      </p>
                      <h2 className="max-w-2xl font-serif text-4xl leading-tight text-white md:text-6xl">
                        {slide.headline}
                      </h2>
                      {slide.external ? (
                        <a
                          href={slide.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-none bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#C6A75E] hover:text-white"
                        >
                          {slide.ctaLabel}
                        </a>
                      ) : (
                        <Link
                          href={slide.href}
                          className="rounded-none bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#C6A75E] hover:text-white"
                        >
                          {slide.ctaLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    </>
  )
}
