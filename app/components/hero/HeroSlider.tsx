"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"

import "swiper/css"

import type { HeroSlide } from "@/lib/supabase/landing-slots"

const FALLBACK_SLIDES: HeroSlide[] = [
  { key: "f1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371", link_type: "none", link_value: "", cta_label: "", cta_subtext: "", subtitle: "", text_position: "right", show_title: true, show_subtitle: true },
  { key: "f2", url: "https://images.unsplash.com/photo-1583001809873-a128495da465", link_type: "none", link_value: "", cta_label: "", cta_subtext: "", subtitle: "", text_position: "right", show_title: true, show_subtitle: true },
]

const HERO_DESKTOP_H = "h-[clamp(260px,34vw,400px)]"
const HERO_MOBILE_H = "h-[clamp(180px,46vw,280px)]"

/** Texto del botón CTA en slides de curso cuando admin no define uno. */
const HERO_COURSE_CTA_LABEL = "Inscríbete ahora"

function buildHref(type: string, value: string): string | undefined {
  if (type === "product" && value) return `/tienda/${value}`
  if (type === "course" && value) return `/academia/${value}`
  if (type === "services") return "/servicios"
  if (type === "custom" && value) return value
  return undefined
}

function shouldShowSlideTitle(slide: HeroSlide): boolean {
  return Boolean(slide.show_title !== false && slide.cta_subtext?.trim())
}

function shouldShowSlideSubtitle(slide: HeroSlide): boolean {
  return Boolean(slide.show_subtitle !== false && slide.subtitle?.trim())
}

function shouldShowSlideButton(slide: HeroSlide, href?: string): boolean {
  if (!href) return false
  if (slide.link_type === "course") return Boolean(slide.link_value)
  return Boolean(slide.cta_label?.trim())
}

/** Muestra bloque lateral/abajo cuando hay contenido editable desde admin. */
function shouldShowSlideContent(slide: HeroSlide, href?: string): boolean {
  return (
    shouldShowSlideTitle(slide) ||
    shouldShowSlideSubtitle(slide) ||
    shouldShowSlideButton(slide, href)
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

function goToSlide(swiper: SwiperType | null, index: number) {
  if (!swiper) return
  const current = swiper.realIndex ?? 0
  if (index === current) return

  if (index > current) {
    swiper.slideTo(swiper.activeIndex + (index - current))
  } else {
    swiper.slideTo(swiper.activeIndex - (current - index))
  }
}

function HeroDots({
  count,
  activeIndex,
  onSelect,
}: {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}) {
  if (count <= 1) return null

  return (
    <div className="hero-pagination-dots" role="tablist" aria-label="Slides del hero">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          className={`hero-dot-btn ${index === activeIndex ? "is-active" : ""}`}
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={`Ir al slide ${index + 1}`}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  )
}

function HeroContentSpacer({ variant }: { variant: "mobile" | "desktop" }) {
  if (variant === "desktop") return null
  return (
    <div
      className="min-h-[160px] bg-white px-5 pb-12 pt-5"
      aria-hidden
    />
  )
}

function SlideContent({
  slide,
  variant,
  href,
}: {
  slide: HeroSlide
  variant: "mobile" | "desktop-split"
  href?: string
}) {
  const pos = slide.text_position ?? "right"
  const alignClass = contentAlignClass(pos)
  const btnAlign = buttonAlignClass(pos)

  const titleClass =
    variant === "mobile"
      ? "font-[family-name:var(--font-playfair),serif] text-[clamp(26px,6.5vw,34px)] font-medium leading-[1.08] tracking-[-0.01em] text-black"
      : "font-[family-name:var(--font-playfair),serif] text-[clamp(22px,2.6vw,34px)] font-medium leading-[1.1] tracking-[-0.01em] text-black"

  const subtitleClass =
    variant === "mobile"
      ? "mt-2 max-w-xl text-sm leading-relaxed text-[#2c2c2c]"
      : "mt-2 max-w-md text-sm leading-[1.55] text-[#2c2c2c] lg:text-[15px]"

  const buttonClass =
    variant === "mobile"
      ? `mt-4 inline-block rounded-full bg-black px-8 py-2 text-xs font-normal tracking-wide text-white ${btnAlign}`
      : `mt-5 inline-block rounded-full bg-black px-8 py-2 text-xs font-normal uppercase tracking-[0.08em] text-white ${btnAlign}`

  const ctaText =
    slide.link_type === "course"
      ? slide.cta_label?.trim() || HERO_COURSE_CTA_LABEL
      : slide.cta_label?.trim() || ""

  const panelClass =
    variant === "mobile"
      ? `flex flex-col bg-white px-5 pb-12 pt-5 ${alignClass}`
      : `flex w-1/2 shrink-0 flex-col justify-center bg-white px-6 py-6 sm:px-10 lg:px-14 ${alignClass}`

  return (
    <div className={panelClass}>
      {shouldShowSlideTitle(slide) && (
        <>
          <h2 className={titleClass}>{slide.cta_subtext}</h2>
          <div className="mb-3 mt-3 h-0.5 w-12 rounded-sm bg-[#c6a75e]" aria-hidden />
        </>
      )}
      {shouldShowSlideSubtitle(slide) && (
        <p className={subtitleClass}>{slide.subtitle}</p>
      )}
      {shouldShowSlideButton(slide, href) && href ? (
        <Link href={href} className={buttonClass}>
          {ctaText}
        </Link>
      ) : null}
    </div>
  )
}

function SlideImage({
  slide,
  variant,
  className,
}: {
  slide: HeroSlide
  variant: "mobile" | "desktop-full" | "desktop-half"
  className?: string
}) {
  const sizeClass =
    variant === "mobile"
      ? `relative w-full ${HERO_MOBILE_H}`
      : variant === "desktop-half"
        ? `relative w-1/2 shrink-0 ${HERO_DESKTOP_H}`
        : `relative w-full ${HERO_DESKTOP_H}`

  return (
    <div className={`${sizeClass} ${className ?? ""}`}>
      <Image
        src={slide.url}
        alt=""
        fill
        priority
        className="object-cover"
        sizes={variant === "desktop-half" ? "50vw" : "100vw"}
      />
    </div>
  )
}

type Props = { slides?: HeroSlide[] }

export default function HeroSlider({ slides }: Props) {
  const mobileSwiperRef = useRef<SwiperType | null>(null)
  const desktopSwiperRef = useRef<SwiperType | null>(null)
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0)
  const [desktopActiveIndex, setDesktopActiveIndex] = useState(0)

  const items =
    slides && slides.length > 0
      ? slides
          .filter((s) => Boolean(s.url?.trim()))
          .map((s) => ({ ...s }))
      : FALLBACK_SLIDES

  const displayItems = items.length > 0 ? items : FALLBACK_SLIDES

  const canLoop = displayItems.length > 1
  const anyShowContent = displayItems.some((slide) =>
    shouldShowSlideContent(slide, buildHref(slide.link_type, slide.link_value))
  )
  const autoplayConfig = canLoop
    ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
    : false

  return (
    <>
      {/* ── MÓVIL ── */}
      <section className="md:hidden">
        <Swiper
          modules={[Autoplay]}
          loop={canLoop}
          autoplay={autoplayConfig}
          speed={900}
          onSwiper={(swiper) => {
            mobileSwiperRef.current = swiper
          }}
          onSlideChange={(swiper) => {
            setMobileActiveIndex(swiper.realIndex)
          }}
        >
          {displayItems.map((slide) => {
            const href = buildHref(slide.link_type, slide.link_value)
            const showContent = shouldShowSlideContent(slide, href)
            const linkWholeSlide = Boolean(href && !showContent)
            const inner = (
              <div>
                <SlideImage slide={slide} variant="mobile" />
                {showContent ? (
                  <SlideContent slide={slide} variant="mobile" href={href} />
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
        <HeroDots
          count={displayItems.length}
          activeIndex={mobileActiveIndex}
          onSelect={(index) => goToSlide(mobileSwiperRef.current, index)}
        />
      </section>

      {/* ── DESKTOP — full bleed, banner delgado estilo OPI ── */}
      <section className="hidden md:block">
        <Swiper
          modules={[Autoplay]}
          loop={canLoop}
          autoplay={autoplayConfig}
          speed={900}
          onSwiper={(swiper) => {
            desktopSwiperRef.current = swiper
          }}
          onSlideChange={(swiper) => {
            setDesktopActiveIndex(swiper.realIndex)
          }}
        >
          {displayItems.map((slide) => {
            const href = buildHref(slide.link_type, slide.link_value)
            const showContent = shouldShowSlideContent(slide, href)
            const linkWholeSlide = Boolean(href && !showContent)
            const inner = showContent ? (
              <div className={`flex ${HERO_DESKTOP_H}`}>
                <SlideImage slide={slide} variant="desktop-half" />
                <SlideContent slide={slide} variant="desktop-split" href={href} />
              </div>
            ) : (
              <SlideImage slide={slide} variant="desktop-full" />
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
        <HeroDots
          count={displayItems.length}
          activeIndex={desktopActiveIndex}
          onSelect={(index) => goToSlide(desktopSwiperRef.current, index)}
        />
      </section>
    </>
  )
}
