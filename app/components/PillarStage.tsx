"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

type Pillar = {
  number: string
  eyebrow: string
  headingBefore: string
  headingEm: string
  body: string
  cta: { label: string; href: string }
  images: [string, string, string]
}

type PillarImages = {
  dist: [string, string, string]
  acad: [string, string, string]
  serv: [string, string, string]
}

const FALLBACK_IMAGES: PillarImages = {
  dist: [
    "https://picsum.photos/seed/nails1/400/600",
    "https://picsum.photos/seed/nails4/400/600",
    "https://picsum.photos/seed/nails7/400/600",
  ],
  acad: [
    "https://picsum.photos/seed/academia1/400/600",
    "https://picsum.photos/seed/academia4/400/600",
    "https://picsum.photos/seed/academia7/400/600",
  ],
  serv: [
    "https://picsum.photos/seed/services1/400/600",
    "https://picsum.photos/seed/services4/400/600",
    "https://picsum.photos/seed/services7/400/600",
  ],
}

function mergePillarImages(
  provided: PillarImages | undefined,
  fallback: PillarImages,
  key: keyof PillarImages
): [string, string, string] {
  const p = provided?.[key]
  return [
    p?.[0] || fallback[key][0],
    p?.[1] || fallback[key][1],
    p?.[2] || fallback[key][2],
  ]
}

function buildPillars(pillarImages?: PillarImages): Pillar[] {
  return [
    {
      number: "01",
      eyebrow: "Distribuidora",
      headingBefore: "Los mejores productos,",
      headingEm: "en un solo lugar.",
      body: "Distribuidora oficial de Exotic, Lovely, Manicure Pro, Golden Nails, Miss Nails, Cezanne, Lia, Mia Secret y más. Envíos a todo México con stock real y garantía de autenticidad.",
      cta: { label: "Ver tienda", href: "/tienda" },
      images: mergePillarImages(pillarImages, FALLBACK_IMAGES, "dist"),
    },
    {
      number: "02",
      eyebrow: "Academia",
      headingBefore: "Formación de alto nivel,",
      headingEm: "donde tú estés.",
      body: "Cursos presenciales impartidos por maestras nacionales e internacionales. Desde nivel principiante hasta avanzado. Todo incluido: certificado, coffee break, comida y material de marca.",
      cta: { label: "Ver academia", href: "/academia" },
      images: mergePillarImages(pillarImages, FALLBACK_IMAGES, "acad"),
    },
    {
      number: "03",
      eyebrow: "Servicios",
      headingBefore: "Quiropodia y uñas profesionales,",
      headingEm: "con quien más sabe.",
      body: "Atención especializada en quiropodia, reconstrucción ungueal, pedicure spa y tratamientos. Muy pronto podrás conocer todo el catálogo y agendar desde el sitio.",
      cta: { label: "Próximamente", href: "/proximamente" },
      images: mergePillarImages(pillarImages, FALLBACK_IMAGES, "serv"),
    },
  ]
}

const SLOT_OFFSETS = [0, 28, 56] as const
const SLOT_HEIGHT = 560

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, inView }
}

function ArrowCta() {
  return (
    <svg
      viewBox="0 0 18 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden
      className="h-3 w-[18px] shrink-0"
    >
      <path d="M0 6 H18 M13 1 L18 6 L13 11" />
    </svg>
  )
}

type Props = {
  pillarImages?: PillarImages
}

export default function PillarStage({ pillarImages }: Props) {
  const PILLARS = buildPillars(pillarImages)
  const [active, setActive] = useState(0)
  const { ref, inView } = useInView()

  const anim = (delay: number) =>
    `transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`

  return (
    <section ref={ref} className="bg-white py-20 text-black">
      <style>{`
        @keyframes pillarBodyIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pillar-body-enter { animation: pillarBodyIn 400ms ease-out both; }
      `}</style>

      <div className="mx-auto max-w-[1400px] px-6">

        {/* ── Header ─────────────────────────────────────── */}
        <div
          className={`mb-14 max-w-[720px] ${anim(0)}`}
          style={{ transitionDelay: "0ms" }}
        >
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
            Lo que hacemos
          </p>
          <h2 className="font-[family-name:var(--font-playfair),serif] text-[clamp(36px,4.4vw,56px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            Tres pilares,{" "}
            <em className="font-medium italic text-[#a8862f]">una sola casa.</em>
          </h2>
          <div className="mt-6 h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
        </div>

        {/* ── Body: 2 columns ────────────────────────────── */}
        <div className="grid lg:items-stretch lg:grid-cols-[1fr_1.2fr] gap-[80px] max-[1023px]:gap-10 max-[1023px]:grid-cols-1">

          {/* Left — pillar list */}
          <div
            className={anim(120)}
            style={{ transitionDelay: "120ms" }}
          >
            {PILLARS.map((pillar, i) => {
              const isActive = active === i
              return (
                <div
                  key={pillar.number}
                  role="button"
                  tabIndex={0}
                  className="w-full cursor-pointer text-left outline-none"
                  style={{
                    padding: "28px 0",
                    borderTop: `1px solid ${isActive ? "#c9a84c" : "#ececec"}`,
                    transition: "border-color 400ms ease",
                  }}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setActive(i)
                  }}
                >
                  {/* Eyebrow row */}
                  <div className="mb-[14px] flex items-center gap-[14px]">
                    <span
                      className="font-[family-name:var(--font-playfair),serif] text-[14px] italic"
                      style={{
                        color: isActive ? "#a8862f" : "#8a8a8a",
                        transition: "color 400ms ease",
                      }}
                    >
                      {pillar.number}
                    </span>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                      style={{
                        color: isActive ? "#a8862f" : "#8a8a8a",
                        transition: "color 400ms ease",
                      }}
                    >
                      {pillar.eyebrow}
                    </span>
                  </div>

                  {/* Heading */}
                  <h3
                    className="font-[family-name:var(--font-playfair),serif] text-[clamp(26px,2.4vw,38px)] font-medium leading-[1.1] tracking-[-0.01em]"
                  >
                    <span style={{ color: isActive ? "#111" : "#bdbdbd", transition: "color 400ms ease" }}>
                      {pillar.headingBefore}{" "}
                    </span>
                    <em
                      className="font-medium italic"
                      style={{ color: isActive ? "#a8862f" : "#bdbdbd", transition: "color 400ms ease" }}
                    >
                      {pillar.headingEm}
                    </em>
                  </h3>

                  {/* Body + CTA — only when active */}
                  {isActive && (
                    <div className="pillar-body-enter">
                      <p className="mt-[18px] mb-[18px] max-w-[380px] text-[13px] font-normal leading-[1.75] text-[#8a8a8a]">
                        {pillar.body}
                      </p>
                      <Link
                        href={pillar.cta.href}
                        className="group inline-flex items-center gap-[10px] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pillar.cta.label}
                        <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
                          <ArrowCta />
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right — triptych */}
          <div
            className={`relative max-[1023px]:hidden ${anim(220)}`}
            style={{
              transitionDelay: "220ms",
              paddingTop: "32px",
              paddingBottom: "44px",
            }}
          >
            {/* Counter — top right */}
            <div
              className="absolute right-0 top-0 font-[family-name:var(--font-playfair),serif] text-[14px] italic tracking-[0.05em]"
            >
              <strong className="text-[#a8862f]">{String(active + 1).padStart(2, "0")}</strong>
              <span className="mx-1.5 text-[#c9a84c]">/</span>
              <span className="text-[#8a8a8a]">03</span>
            </div>

            {/* 3-slot grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px",
              }}
            >
              {SLOT_OFFSETS.map((offset, slot) => (
                <div
                  key={slot}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    height: `${SLOT_HEIGHT}px`,
                    transform: `translateY(${offset}px)`,
                  }}
                >
                  {PILLARS.map((pillar, pi) => (
                    <div
                      key={pi}
                      className="absolute inset-0"
                      style={{
                        opacity: active === pi ? 1 : 0,
                        transform: active === pi ? "scale(1)" : "scale(1.05)",
                        transition: `opacity 700ms ease ${slot * 60}ms, transform 1200ms ease ${slot * 60}ms`,
                      }}
                    >
                      <Image
                        src={pillar.images[slot]}
                        alt={`${pillar.eyebrow} — imagen ${slot + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 13vw, 160px"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Indicator bars — bottom left */}
            <div className="absolute bottom-0 left-0 flex gap-2">
              {PILLARS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "3px",
                    borderRadius: "999px",
                    width: active === i ? "112px" : "8px",
                    background: active === i ? "#c9a84c" : "#ececec",
                    transition: "width 400ms ease, background-color 400ms ease",
                  }}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
