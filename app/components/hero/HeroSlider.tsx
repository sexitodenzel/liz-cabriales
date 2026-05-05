"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"

export default function HeroSlider() {
  return (
    <section className="h-[80vh] px-6">
      <div className="mx-auto h-full max-w-[1400px] overflow-hidden rounded-md">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 4000 }}
          loop
          pagination={{ clickable: true }}
          navigation
          speed={900}
          className="h-full"
        >
          <SwiperSlide>
            <div className="relative h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1604654894610-df63bc536371"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" aria-hidden />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="relative h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1583001809873-a128495da465"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" aria-hidden />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="relative h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1596704017254-9756e98c3c54"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" aria-hidden />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>
  )
}
