"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"
import "swiper/css/effect-fade"

const FALLBACK_SLIDES = [
  "https://images.unsplash.com/photo-1604654894610-df63bc536371",
  "https://images.unsplash.com/photo-1583001809873-a128495da465",
  "https://images.unsplash.com/photo-1596704017254-9756e98c3c54",
]

type Props = {
  slides?: string[]
}

export default function HeroSlider({ slides }: Props) {
  const urls = (slides ?? []).map((s, i) => (s || FALLBACK_SLIDES[i] || FALLBACK_SLIDES[0]))

  return (
    <section className="h-[88vh] px-2 pt-4 md:h-[80vh] md:px-6 md:pt-8">
      <div className="mx-auto h-full max-w-[1400px] overflow-hidden rounded-md">
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 4000 }}
          loop
          pagination={{ clickable: true }}
          navigation
          speed={900}
          className="h-full"
        >
          {urls.map((src, i) => (
            <SwiperSlide key={i}>
              <div className="relative h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" aria-hidden />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
