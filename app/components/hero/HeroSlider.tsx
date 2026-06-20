"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination, EffectFade, Autoplay } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/effect-fade"

import type { HeroSlide } from "@/lib/supabase/landing-slots"

const FALLBACK_SLIDES: HeroSlide[] = [
  { key: "f1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371", link_type: "none", link_value: "", cta_label: "", cta_subtext: "", subtitle: "", text_position: "right", show_title: true, show_subtitle: true },
  { key: "f2", url: "https://images.unsplash.com/photo-1583001809873-a128495da465", link_type: "none", link_value: "", cta_label: "", cta_subtext: "", subtitle: "", text_position: "right", show_title: true, show_subtitle: true },
]

/** Texto del botón CTA en slides de curso cuando admin no define uno. */
const HERO_COURSE_CTA_LABEL = "Inscríbete ahora"

function buildHref(type: string, value: string): string | undefined {
  if (type === "product" && value) return `/tienda/${value}`
  if (type === "course" && value) return `/academia/${value}`
  if (type === "services") return "/servicios"
  if (type === "custom" && value) return value
  return undefined
}

/** Solo slides vinculados a un curso en admin/Media muestran texto + CTA debajo de la imagen. */
function shouldShowCourseContent(slide: HeroSlide): boolean {
  if (slide.link_type !== "course") return false
  return Boolean(
    (slide.show_title !== false && slide.cta_subtext) ||
      (slide.show_subtitle !== false && slide.subtitle) ||
      slide.cta_label?.trim() ||
      slide.link_value
  )
}

function contentAlignClass(pos: HeroSlide["text_position"]) {
  if (pos === "center") return "items-center text-center"
  if (pos === "right") return "items-end text-right"
  return "items-start text-left"
}

function buttonAlignClass(pos: HeroSlide["text_position"]) {
  if (pos === "center") return "self-center"
  if (pos === "right") return "self-end"
  return "self-start"
}

/** Reserva la misma altura que el bloque de curso cuando otro slide sí lo muestra. */
function HeroContentSpacer({ variant }: { variant: "mobile" | "desktop" }) {
  return (
    <div
      className={`bg-white px-5 pt-5 md:px-8 md:pt-6 ${
        variant === "mobile" ? "pb-14" : "pb-10"
      } min-h-[220px] md:min-h-[240px]`}
      aria-hidden
    />
  )
}

function SlideCourseContent({
  slide,
  variant,
  href,
  reserveHeight,
}: {
  slide: HeroSlide
  variant: "mobile" | "desktop"
  href?: string
  reserveHeight?: boolean
}) {
  const pos = slide.text_position ?? "left"
  const alignClass = contentAlignClass(pos)
  const btnAlign = buttonAlignClass(pos)
  const titleClass =
    variant === "mobile"
      ? "font-[family-name:var(--font-playfair),serif] text-[clamp(32px,8vw,40px)] font-medium leading-[1.05] tracking-[-0.01em] text-black"
      : "font-[family-name:var(--font-playfair),serif] text-[clamp(36px,4.4vw,56px)] font-medium leading-[1.05] tracking-[-0.01em] text-black"

  const subtitleClass =
    variant === "mobile"
      ? "mt-2 max-w-xl text-sm leading-relaxed text-[#2c2c2c]"
      : "mt-2 max-w-2xl text-[15px] leading-[1.55] text-[#2c2c2c]"

  const buttonClass =
    variant === "mobile"
      ? `mt-5 inline-block rounded-full bg-black px-10 py-2 text-xs font-normal tracking-wide text-white ${btnAlign}`
      : `mt-6 inline-block rounded-full bg-black px-10 py-2 text-sm font-normal tracking-wide text-white ${btnAlign}`

  const ctaText = HERO_COURSE_CTA_LABEL

  return (
    <div
      className={`flex flex-col bg-white px-5 pt-5 md:px-8 md:pt-6 ${alignClass} ${
        variant === "mobile" ? "pb-14" : "pb-10"
      } ${reserveHeight ? "min-h-[220px] md:min-h-[240px]" : ""}`}
    >
      {slide.show_title !== false && slide.cta_subtext && (
        <>
          <h2 className={titleClass}>{slide.cta_subtext}</h2>
          <div className="mb-4 mt-[18px] h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
        </>
      )}
      {slide.show_subtitle !== false && slide.subtitle && (
        <p className={subtitleClass}>{slide.subtitle}</p>
      )}
      {href ? (
        <Link href={href} className={buttonClass}>
          {ctaText}
        </Link>
      ) : (
        <span className={buttonClass}>{ctaText}</span>
      )}
    </div>
  )
}

type Props = { slides?: HeroSlide[] }

export default function HeroSlider({ slides }: Props) {
  const desktopPaginationRef = useRef<HTMLDivElement>(null)

  const items =
    slides && slides.length > 0
      ? slides
          .filter((s) => Boolean(s.url?.trim()))
          .map((s) => ({ ...s }))
      : FALLBACK_SLIDES

  const displayItems = items.length > 0 ? items : FALLBACK_SLIDES

  const canLoop = displayItems.length > 1
  const anyShowContent = displayItems.some(shouldShowCourseContent)
  const autoplayConfig = canLoop
    ? { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }
    : false

  return (
    <>
      {/* ── MÓVIL ── */}
      <section className="-mx-6 md:hidden">
        <Swiper
          modules={[Pagination, EffectFade, Autoplay]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={canLoop}
          autoplay={autoplayConfig}
          pagination={{ clickable: true }}
          speed={900}
        >
          {displayItems.map((slide) => {
            const href = buildHref(slide.link_type, slide.link_value)
            const showContent = shouldShowCourseContent(slide)
            const linkWholeSlide = Boolean(href && !showContent)
            const inner = (
              <div>
                <div className="relative h-[62vw] w-full">
                  <Image
                    src={slide.url}
                    alt=""
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
                {showContent ? (
                  <SlideCourseContent
                    slide={slide}
                    variant="mobile"
                    href={href}
                    reserveHeight={anyShowContent}
                  />
                ) : anyShowContent ? (
                  <HeroContentSpacer variant="mobile" />
                ) : null}
              </div>
            )
            return (
              <SwiperSlide key={slide.key}>
                {linkWholeSlide ? (
                  <Link href={href!} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </SwiperSlide>
            )
          })}
        </Swiper>
      </section>

      {/* ── DESKTOP ── */}
      <section className="hidden md:block md:pt-8">
        <div>
          <Swiper
            modules={[Pagination, EffectFade, Autoplay]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            loop={canLoop}
            autoplay={autoplayConfig}
            pagination={{ clickable: true }}
            onBeforeInit={(swiper) => {
              const el = desktopPaginationRef.current
              if (!el || !swiper.params.pagination || typeof swiper.params.pagination === "boolean") {
                return
              }
              swiper.params.pagination.el = el
            }}
            onSwiper={(swiper) => {
              const el = desktopPaginationRef.current
              if (!el || !swiper.params.pagination || typeof swiper.params.pagination === "boolean") {
                return
              }
              if (swiper.pagination.el === el) return
              swiper.params.pagination.el = el
              swiper.pagination.destroy()
              swiper.pagination.init()
              swiper.pagination.render()
              swiper.pagination.update()
            }}
            speed={900}
            className="overflow-hidden rounded-md"
          >
            {displayItems.map((slide) => {
              const href = buildHref(slide.link_type, slide.link_value)
              const showContent = shouldShowCourseContent(slide)
              const linkWholeSlide = Boolean(href && !showContent)
              const inner = (
                <div>
                  <div className="relative h-[78vh] w-full">
                    <Image
                      src={slide.url}
                      alt=""
                      fill
                      priority
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                  {showContent ? (
                    <SlideCourseContent
                      slide={slide}
                      variant="desktop"
                      href={href}
                      reserveHeight={anyShowContent}
                    />
                  ) : anyShowContent ? (
                    <HeroContentSpacer variant="desktop" />
                  ) : null}
                </div>
              )
              return (
                <SwiperSlide key={slide.key}>
                  {linkWholeSlide ? (
                    <Link href={href!} className="block">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </SwiperSlide>
              )
            })}
          </Swiper>
          <div ref={desktopPaginationRef} className="hero-desktop-dots mt-4 flex justify-start gap-3" />
        </div>
      </section>
    </>
  )
}
