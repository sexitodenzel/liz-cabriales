"use client"

import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination, EffectFade } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/effect-fade"

import type { HeroSlide } from "@/lib/supabase/landing-slots"

const FALLBACK_SLIDES: HeroSlide[] = [
  { key: "f1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371", link_type: "none", link_value: "", cta_label: "", cta_subtext: "", subtitle: "", text_position: "right", show_title: true, show_subtitle: true },
  { key: "f2", url: "https://images.unsplash.com/photo-1583001809873-a128495da465", link_type: "none", link_value: "", cta_label: "", cta_subtext: "", subtitle: "", text_position: "right", show_title: true, show_subtitle: true },
]

function buildHref(type: string, value: string): string | undefined {
  if (type === "product" && value) return `/tienda/${value}`
  if (type === "course" && value) return `/academia/${value}`
  if (type === "services") return "/servicios"
  if (type === "custom" && value) return value
  return undefined
}

type Props = { slides?: HeroSlide[] }

export default function HeroSlider({ slides }: Props) {
  const items = slides && slides.length > 0
    ? slides.map((s, i) => ({ ...s, url: s.url || FALLBACK_SLIDES[i]?.url || FALLBACK_SLIDES[0].url }))
    : FALLBACK_SLIDES

  return (
    <>
      {/* ── MÓVIL ── */}
      <section className="-mx-6 md:hidden">
        <Swiper
          modules={[Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop
          pagination={{ clickable: true }}
          speed={900}
          autoHeight
        >
          {items.map((slide) => {
            const href = buildHref(slide.link_type, slide.link_value)
            const hasCTA = slide.cta_subtext || slide.cta_label
            const inner = (
              <div>
                <div className="relative h-[62vw] w-full">
                  <Image src={slide.url} alt="" fill priority className="object-cover" sizes="100vw" />
                </div>
                {hasCTA && (
                  <div className="flex flex-col bg-white px-5 pb-14 pt-5">
                    {slide.cta_subtext && (
                      <h2 className="text-[2.5rem] font-light leading-tight text-gray-900">
                        {slide.cta_subtext}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-900">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.cta_label && (
                      <span className="mt-5 inline-block self-start rounded-full bg-gray-900 px-10 py-3.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-300 active:bg-[#c9a84c]">
                        {slide.cta_label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
            return (
              <SwiperSlide key={slide.key}>
                {href ? <Link href={href} className="block">{inner}</Link> : inner}
              </SwiperSlide>
            )
          })}
        </Swiper>
      </section>

      {/* ── DESKTOP ── */}
      <section className="hidden md:block md:px-6 md:pt-8">
        <div className="mx-auto max-w-[1400px]">
          {/* Slider */}
          <div className="relative h-[78vh] overflow-hidden rounded-md">
            <Swiper
              modules={[Pagination, EffectFade]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              loop
              pagination={{ clickable: true, el: ".hero-desktop-dots" }}
              speed={900}
              className="h-full"
            >
              {items.map((slide) => {
                const href = buildHref(slide.link_type, slide.link_value)
                const hasCTA = slide.cta_subtext || slide.cta_label
                const inner = (
                  <div className="relative h-full">
                    <Image src={slide.url} alt="" fill priority className="object-cover" sizes="100vw" />
                    {hasCTA && (() => {
                      const pos = slide.text_position ?? 'right'
                      const posClass =
                        pos === 'left'   ? 'left-[7%]' :
                        pos === 'center' ? 'left-1/2 -translate-x-1/2 items-center text-center' :
                                           'right-[7%]'
                      return (
                        <div className={`absolute top-1/2 flex w-[42%] -translate-y-1/2 flex-col ${posClass}`}>
                          {slide.show_title !== false && slide.cta_subtext && (
                            <h2 className="text-5xl font-light leading-tight text-gray-900">
                              {slide.cta_subtext}
                            </h2>
                          )}
                          {slide.show_subtitle !== false && slide.subtitle && (
                            <p className="mt-4 text-base leading-relaxed text-gray-700">
                              {slide.subtitle}
                            </p>
                          )}
                          {slide.cta_label && (
                            <span className={`mt-6 inline-block rounded-full bg-gray-900 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors duration-300 hover:bg-[#c9a84c] ${pos === 'center' ? 'self-center' : 'self-start'}`}>
                              {slide.cta_label}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )
                return (
                  <SwiperSlide key={slide.key}>
                    {href ? <Link href={href} className="block h-full">{inner}</Link> : inner}
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </div>
          {/* Puntitos fuera del slider, lado izquierdo */}
          <div className="hero-desktop-dots mt-4 flex gap-2" />
        </div>
      </section>
    </>
  )
}
