"use client"

import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, EffectFade } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/effect-fade"

import type { HeroSlide } from "@/lib/supabase/landing-slots"

const FALLBACK_SLIDES: HeroSlide[] = [
  { key: "f1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371", link_type: "none", link_value: "", cta_label: "", cta_subtext: "" },
  { key: "f2", url: "https://images.unsplash.com/photo-1583001809873-a128495da465", link_type: "none", link_value: "", cta_label: "", cta_subtext: "" },
]

function buildHref(type: string, value: string): string | undefined {
  if (type === "product" && value) return `/tienda/${value}`
  if (type === "course" && value) return `/academia/${value}`
  if (type === "services") return "/servicios"
  if (type === "custom" && value) return value
  return undefined
}

type Props = {
  slides?: HeroSlide[]
}

export default function HeroSlider({ slides }: Props) {
  const items = slides && slides.length > 0
    ? slides.map((s, i) => ({ ...s, url: s.url || FALLBACK_SLIDES[i]?.url || FALLBACK_SLIDES[0].url }))
    : FALLBACK_SLIDES

  return (
    <section className="h-[88vh] px-2 pt-4 md:h-[80vh] md:px-6 md:pt-8">
      <div className="mx-auto h-full max-w-[1400px] overflow-hidden rounded-md">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 4000 }}
          loop
          pagination={{ clickable: true }}
          speed={900}
          className="h-full"
        >
          {items.map((slide) => {
            const href = buildHref(slide.link_type, slide.link_value)

            const inner = (
              <div className="relative h-full">
                <Image
                  src={slide.url}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/30" aria-hidden />
                {(slide.cta_subtext || slide.cta_label) && (
                  <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center px-4">
                    <div className="flex animate-fade-up flex-col items-center justify-center gap-3">
                      {slide.cta_subtext && (
                        <p className="max-w-sm text-center text-sm font-semibold text-white [text-shadow:_0_2px_8px_rgba(0,0,0,0.9),_0_1px_3px_rgba(0,0,0,0.8)]">
                          {slide.cta_subtext}
                        </p>
                      )}
                      {slide.cta_label && (
                        <span className="inline-block rounded-md bg-[#c9a84c] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#b8943e] hover:shadow-xl">
                          {slide.cta_label}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )

            return (
              <SwiperSlide key={slide.key}>
                {href ? (
                  <Link href={href} className="block h-full">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </section>
  )
}
