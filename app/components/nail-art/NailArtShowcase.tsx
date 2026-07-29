"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"

import SmoothImage from "@/app/components/shared/SmoothImage"
import { useNailArtFavorites } from "@/app/components/wishlist/NailArtFavoritesContext"
import { nailArtImageApiPath } from "@/lib/nail-art-image"
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/ui/icons"
import type { NailArtPost } from "@/lib/supabase/nail-art"

/* Vitrina Nail Art con pestañas (estilo "Summer Nail Art" de OPI): título
   editorial + subtítulo a la izquierda, pestañas-píldora a la derecha, y un
   rail horizontal de diseños. Reutiliza el reveal escalonado global
   (.lc-shopper-track) y el contexto de favoritos. Client porque el favorito
   (estrella) vive en localStorage vía NailArtFavoritesContext. */

export type NailArtShowcaseTab = {
  id: string
  label: string
  posts: NailArtPost[]
}

type Props = {
  tabs: NailArtShowcaseTab[]
  eyebrow?: string
  title: string
  subtitle?: string
  ctaHref?: string
  ctaLabel?: string
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function FavoriteHeart({ postId }: { postId: string }) {
  const { has, toggle, hydrated } = useNailArtFavorites()
  const [burst, setBurst] = useState(false)
  const favorited = hydrated ? has(postId) : false

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = toggle(postId)
    if (next) {
      setBurst(true)
      window.setTimeout(() => setBurst(false), 480)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorited}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-90 ${
        favorited ? "text-[#e0607a]" : "text-ink-soft/60 hover:text-[#e0607a]"
      }`}
    >
      <Heart
        className={`h-[18px] w-[18px] transition-transform ${
          favorited ? "fill-[#e0607a]" : ""
        } ${burst ? "scale-125" : ""}`}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  )
}

function ShowcaseCard({ post, index }: { post: NailArtPost; index: number }) {
  // Si el cover es una URL absoluta (demo hardcodeado), úsala directo; si no,
  // pasa por la ruta de la app que resuelve el Storage privado.
  const cover =
    post.cover_image && /^https?:\/\//.test(post.cover_image)
      ? post.cover_image
      : nailArtImageApiPath(post.id)
  const chips = post.linked_products.slice(0, 2)

  return (
    <div
      className="lc-card group w-[62vw] max-w-[260px] shrink-0 snap-start sm:w-[220px] lg:w-[calc((100%-96px)/5)] lg:max-w-none"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        className="relative overflow-hidden rounded-xl bg-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_rgba(20,20,20,0.06)]"
        style={{ aspectRatio: "3/4" }}
      >
        <Link
          href={`/nail-art/${post.slug}`}
          className="absolute inset-0 z-0 block"
          aria-label={post.title}
        >
          <SmoothImage
            src={cover}
            alt={post.title}
            fill
            className="lc-card-img object-cover"
            sizes="(max-width: 640px) 62vw, (max-width: 1024px) 220px, 20vw"
          />
        </Link>

        {post.is_editorial && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm">
            Por Nosotros
          </span>
        )}
      </div>

      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-sans text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={`/nail-art/${post.slug}`} className="transition-colors hover:text-gold">
              {post.title}
            </Link>
          </h3>
          <FavoriteHeart postId={post.id} />
        </div>
        {post.author_display_name && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
            Por {post.author_display_name}
          </p>
        )}
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map((lp) => (
              <span
                key={lp.id}
                className="max-w-full truncate rounded-full border border-gold-soft/40 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-gold"
              >
                {lp.product.name}
              </span>
            ))}
            {post.linked_products.length > chips.length && (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-medium text-ink-soft/70">
                +{post.linked_products.length - chips.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "left" | "right"
  disabled: boolean
  onClick: () => void
}) {
  const Icon = dir === "left" ? ChevronLeftIcon : ChevronRightIcon
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Anterior" : "Siguiente"}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 cursor-pointer items-center justify-center bg-transparent text-ink transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

export default function NailArtShowcase({
  tabs,
  eyebrow,
  title,
  subtitle,
  ctaHref = "/nail-art",
  ctaLabel = "Ver todo",
}: Props) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "")
  const scrollerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  // Reveal escalonado: dispara una vez al entrar al viewport (mismo patrón
  // que TabbedShopper); fallback por si el observer no dispara.
  useEffect(() => {
    if (revealed) return
    const el = sectionRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      setRevealed(true)
      return
    }
    const fallback = window.setTimeout(() => setRevealed(true), 1600)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setRevealed(true)
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [revealed])

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => updateScrollState()
    el.addEventListener("scroll", onScroll, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      ro.disconnect()
    }
  }, [updateScrollState, active?.id])

  if (!active) return null

  const selectTab = (id: string) => {
    if (id === activeId) return
    setActiveId(id)
    scrollerRef.current?.scrollTo({
      left: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  const scrollByViewport = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({
      left: dir * el.clientWidth * 0.82,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  return (
    <section ref={sectionRef} aria-labelledby="nail-art-showcase-title">
      {/* Header estilo OPI "Summer Nail Art": título + subtítulo editoriales a la
          izquierda, pestañas-píldora a la derecha. */}
      <div className="mb-8 flex flex-col gap-y-6 md:flex-row md:items-end md:justify-between md:gap-x-10">
        <div className="max-w-[640px]">
          {eyebrow && (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {eyebrow}
            </p>
          )}
          <h2
            id="nail-art-showcase-title"
            className="font-sans text-[clamp(26px,3.4vw,38px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[clamp(22px,3vw,34px)] font-normal leading-[1.15] tracking-[-0.015em] text-ink-soft">
              {subtitle}
            </p>
          )}
        </div>

        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label="Categorías de Nail Art"
            className="flex min-w-0 gap-2.5 overflow-x-auto scrollbar-hide md:justify-end"
          >
            {tabs.map((tab) => {
              const isActive = tab.id === active.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectTab(tab.id)}
                  className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 sm:text-[12px] ${
                    isActive
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-ink-soft hover:border-neutral-500 hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div
        key={active.id}
        ref={scrollerRef}
        className={`lc-shopper-track flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide lg:gap-6 ${
          revealed ? "is-revealed" : ""
        }`}
      >
        {active.posts.map((post, i) => (
          <ShowcaseCard key={post.id} post={post} index={i} />
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold transition-colors duration-300 hover:text-ink"
        >
          {ctaLabel}
          <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
            <ChevronRightIcon className="h-4 w-4" />
          </span>
        </Link>

        {/* Flechas de apoyo en desktop cuando el rail desborda. */}
        <div className="hidden shrink-0 gap-1.5 md:flex">
          <ArrowButton dir="left" disabled={!canScrollLeft} onClick={() => scrollByViewport(-1)} />
          <ArrowButton dir="right" disabled={!canScrollRight} onClick={() => scrollByViewport(1)} />
        </div>
      </div>
    </section>
  )
}
