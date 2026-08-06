"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"

import SmoothImage from "@/app/components/shared/SmoothImage"
import { ChevronRightIcon } from "@/app/components/ui/icons"
import { EASE_OUT } from "@/lib/ease"
import type { HomeSpotlightItem } from "@/lib/supabase/home-spotlight"

/* Sección "Spotlight" del home: distribución editorial estilo OPI Pro
   Spotlight — texto grande a la izquierda + collage asimétrico de imágenes
   superpuestas a la derecha, cada una con avatar y etiqueta opcionales.
   Contenido curado desde /admin/home-spotlight. Reveal de letras (máscara
   clip + stagger) en el título y aparición escalonada del collage.

   Todo con motion/react + whileInView once, respetando prefers-reduced-motion
   (useReducedMotion desactiva las animaciones y muestra el contenido fijo). */

type Props = {
  items: HomeSpotlightItem[]
  eyebrow?: string
  /** Título editorial; se parte por líneas para el reveal enmascarado. */
  titleLines?: string[]
  subtitle?: string
  body?: string
  ctaHref?: string
  ctaLabel?: string
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
}

const maskUp: Variants = {
  hidden: { y: "115%" },
  show: { y: 0, transition: { duration: 0.75, ease: EASE_OUT } },
}

const collage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
}

const cardIn: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
}

/** Relación de aspecto por posición: da ritmo editorial al collage. */
const ASPECTS = ["3/4", "4/5", "1/1", "4/5", "3/4", "1/1"]

type AvatarCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right"

const AVATAR_POS: Record<AvatarCorner, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
}

/* Mosaico disperso estilo OPI: imágenes de distintos tamaños, encimadas y a
   distintas alturas. Cada slot es una posición absoluta dentro de un lienzo de
   relación 7/6. left/top/width en % (relativos al ancho/alto del lienzo); el
   alto de cada imagen lo define su `aspect`. `z` controla el traslape. */
type Slot = {
  left: string
  top: string
  width: string
  aspect: string
  z: number
  avatar: AvatarCorner
}

const DESKTOP_SLOTS: Slot[] = [
  { left: "0%", top: "26%", width: "35%", aspect: "4/5", z: 20, avatar: "bottom-left" },
  { left: "39%", top: "0%", width: "27%", aspect: "4/5", z: 10, avatar: "bottom-left" },
  { left: "72%", top: "9%", width: "28%", aspect: "4/5", z: 10, avatar: "top-right" },
  { left: "36%", top: "35%", width: "30%", aspect: "3/5", z: 30, avatar: "bottom-right" },
  { left: "70%", top: "54%", width: "30%", aspect: "3/4", z: 20, avatar: "top-left" },
]

/* Móvil: piezas un poco más grandes y más juntas para llenar el lienzo. */
const MOBILE_SLOTS: Slot[] = [
  { left: "0%", top: "16%", width: "46%", aspect: "4/5", z: 20, avatar: "bottom-left" },
  { left: "40%", top: "0%", width: "35%", aspect: "4/5", z: 10, avatar: "bottom-left" },
  { left: "68%", top: "4%", width: "32%", aspect: "4/5", z: 10, avatar: "top-right" },
  { left: "28%", top: "26%", width: "40%", aspect: "3/5", z: 30, avatar: "bottom-right" },
  { left: "64%", top: "46%", width: "36%", aspect: "3/4", z: 20, avatar: "top-left" },
]

function CollageCard({
  item,
  index,
  variant,
  slot,
}: {
  item: HomeSpotlightItem
  index: number
  variant: "rail" | "column" | "scatter"
  slot?: Slot
}) {
  const aspect = slot?.aspect ?? ASPECTS[index % ASPECTS.length]
  const avatarCorner: AvatarCorner = slot?.avatar ?? "bottom-right"
  const wrapperCls =
    variant === "rail"
      ? "w-[64vw] max-w-[280px] shrink-0 snap-start"
      : variant === "scatter"
        ? "absolute"
        : "w-full"
  const wrapperStyle =
    variant === "scatter" && slot
      ? { left: slot.left, top: slot.top, width: slot.width, zIndex: slot.z }
      : undefined
  // La etiqueta debe esquivar el avatar si comparten la esquina inferior.
  const labelPad =
    item.avatar_url && avatarCorner === "bottom-left" ? "left-16 right-3" : "left-3 right-14"

  const inner = (
    <div
      className="group relative overflow-hidden rounded-xl bg-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_rgba(20,20,20,0.08)]"
      style={{ aspectRatio: aspect }}
    >
      <SmoothImage
        src={item.image_url}
        alt={item.label ?? "Spotlight"}
        fill
        className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
        sizes="(max-width: 1024px) 64vw, 22vw"
      />

      {/* Velo inferior para legibilidad de la etiqueta */}
      {item.label && (
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent"
          aria-hidden
        />
      )}

      {item.label && (
        <span
          className={`pointer-events-none absolute bottom-3 z-10 truncate text-[13px] font-medium tracking-wide text-white drop-shadow-sm ${labelPad}`}
        >
          {item.label}
        </span>
      )}

      {item.avatar_url && (
        <span
          className={`absolute z-10 h-12 w-12 overflow-hidden rounded-full ring-2 ring-white shadow-md sm:h-14 sm:w-14 ${AVATAR_POS[avatarCorner]}`}
        >
          <SmoothImage
            src={item.avatar_url}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </span>
      )}
    </div>
  )

  const content = item.link_href ? (
    <Link href={item.link_href} className="block" aria-label={item.label ?? "Ver más"}>
      {inner}
    </Link>
  ) : (
    inner
  )

  return (
    <motion.div variants={cardIn} className={wrapperCls} style={wrapperStyle}>
      {content}
    </motion.div>
  )
}

export default function HomeSpotlight({
  items,
  eyebrow = "El estudio",
  titleLines = ["Lo último del", "estudio"],
  subtitle,
  body = "Diseños, momentos y trabajo del día a día — curado a mano por el equipo.",
  ctaHref = "/nail-art",
  ctaLabel = "Ver la galería",
}: Props) {
  const reducedMotion = useReducedMotion()
  const animate = !reducedMotion

  const motionProps = animate
    ? {
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, margin: "0px 0px -100px 0px" },
      }
    : {}

  const sampleAvatar = items.find((it) => it.avatar_url)?.avatar_url ?? null

  return (
    <section className="pt-14 pb-6 md:py-24" aria-labelledby="home-spotlight-title">
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Columna de texto */}
        <motion.div
          className="lg:col-span-5"
          variants={container}
          {...motionProps}
        >
          <motion.p
            variants={fadeUp}
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold"
          >
            {eyebrow}
          </motion.p>

          <h2
            id="home-spotlight-title"
            className="text-[clamp(34px,5.2vw,60px)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink"
          >
            {titleLines.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.04em]">
                <motion.span
                  variants={maskUp}
                  className="block will-change-transform"
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h2>

          {subtitle && (
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[420px] text-[15px] font-medium leading-[1.5] text-ink"
            >
              {subtitle}
            </motion.p>
          )}

          {sampleAvatar && (
            <motion.div variants={fadeUp} className="mt-8">
              <span className="relative block h-16 w-16 overflow-hidden rounded-full ring-1 ring-line">
                <SmoothImage
                  src={sampleAvatar}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </span>
            </motion.div>
          )}

          {body && (
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-[380px] text-[15px] leading-[1.65] text-ink-soft"
            >
              {body}
            </motion.p>
          )}

          <motion.div variants={fadeUp} className="mt-8">
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-neutral-800"
            >
              {ctaLabel}
              <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
                <ChevronRightIcon className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Collage — mosaico disperso estilo OPI. Móvil usa slots más grandes;
            desktop mantiene el layout 7/6 original. */}
        <motion.div
          className="relative aspect-[4/5] lg:col-span-7 lg:hidden"
          variants={collage}
          {...motionProps}
        >
          {items.slice(0, MOBILE_SLOTS.length).map((item, i) => (
            <CollageCard
              key={item.id}
              item={item}
              index={i}
              variant="scatter"
              slot={MOBILE_SLOTS[i]}
            />
          ))}
        </motion.div>
        <motion.div
          className="relative hidden lg:col-span-7 lg:block lg:aspect-[7/6]"
          variants={collage}
          {...motionProps}
        >
          {items.slice(0, DESKTOP_SLOTS.length).map((item, i) => (
            <CollageCard
              key={item.id}
              item={item}
              index={i}
              variant="scatter"
              slot={DESKTOP_SLOTS[i]}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
