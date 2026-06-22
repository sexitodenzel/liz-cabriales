"use client"

import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"

export type Testimonial = {
  id: string
  name: string
  course: string
  quote: string
  photo: string
}

type Props = {
  items: Testimonial[]
}

function QuoteMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-7 w-7 text-[#c9a84c]/35">
      <path d="M9.5 5C6.46 5 4 7.46 4 10.5V19h7.5v-7.5H7.75C7.75 9.4 8.9 8.25 10.5 8.25V5h-1zm10 0C16.46 5 14 7.46 14 10.5V19h7.5v-7.5h-3.75c0-2.1 1.15-3.25 2.75-3.25V5h-1z" />
    </svg>
  )
}

export default function TestimonialsCarousel({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="sobre-liz-testimonials">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        spaceBetween={20}
        loop={items.length > 2}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 24 },
        }}
        className="!pb-12"
      >
        {items.map((t) => (
          <SwiperSlide key={t.id} className="h-auto">
            <figure className="flex h-full flex-col rounded-2xl border border-[#c9a84c]/20 bg-white p-7">
              <QuoteMark />
              <blockquote className="mt-3 flex-1 text-[14.5px] leading-[1.7] text-[#3a3a3a]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3.5 border-t border-[#c9a84c]/15 pt-5">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                  <Image
                    src={t.photo}
                    alt={t.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[#111]">{t.name}</span>
                  <span className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-[#a8862f]">
                    {t.course}
                  </span>
                </span>
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
