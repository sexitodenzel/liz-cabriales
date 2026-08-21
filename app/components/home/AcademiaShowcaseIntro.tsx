"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"

import SmoothImage from "@/app/components/shared/SmoothImage"
import { EASE_OUT } from "@/lib/ease"

/* Portada del riel de academia: mismo footprint que CourseCard (aspect 3/4).
   Con foto de fondo se comporta como panel editorial (foto a sangre + velo +
   texto claro + CTA en píldora). Sin foto cae al fondo gris de siempre con
   texto oscuro, así que la card nunca queda ilegible si el slot está vacío. */

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}

const maskUp: Variants = {
  hidden: { y: "115%" },
  show: { y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}

/* El degradado gris es solo el caso sin foto: cuando hay `coverImage`, la
   imagen a sangre y su velo lo tapan por completo. */
const CARD_CLS =
  "group relative flex aspect-[3/4] w-[82vw] shrink-0 flex-col overflow-hidden rounded-card bg-gradient-to-b from-[#f7f7f7] via-[#f2f2f2] to-[#eaeaea] sm:w-[380px] lg:w-[420px]"

const TITLE_CLS =
  "text-[clamp(26px,4.6vw,34px)] font-semibold leading-[1.08] tracking-[-0.02em]"

/** Paleta de texto según haya foto de fondo o no. */
function tones(hasCover: boolean) {
  return {
    eyebrow: hasCover ? "text-white/75" : "text-ink-soft",
    title: hasCover ? "text-white" : "text-ink",
    copy: hasCover ? "text-white/80" : "text-ink-soft",
    count: hasCover ? "text-white/65" : "text-ink-soft",
    cta: hasCover
      ? "bg-white text-ink group-hover:bg-gold group-hover:text-white"
      : "bg-ink text-white group-hover:bg-gold",
  }
}

function Cta({ className }: { className: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 ${className}`}
    >
      Ver la academia
      <span
        aria-hidden
        className="transition-transform duration-300 ease-out group-hover:translate-x-1"
      >
        →
      </span>
    </span>
  )
}

function CountLine({ count, className }: { count: number; className: string }) {
  if (count <= 0) return null
  const label = count === 1 ? "formación activa" : "formaciones activas"
  return (
    <p className={`text-[11px] tabular-nums tracking-[0.08em] ${className}`}>
      {count} {label}
    </p>
  )
}

const COPY =
  "Formación presencial y online para onicotécnicas, pedicuristas y quiropodistas. Contamos con más de 7 años preparando profesionales de éxito desde Tampico, Tamaulipas."

type BodyProps = { count: number; hasCover: boolean }

function StaticBody({ count, hasCover }: BodyProps) {
  const t = tones(hasCover)
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${t.eyebrow}`}>
          Academia
        </p>
        <h2 className={`${TITLE_CLS} ${t.title} mt-3`}>Cursos y certificaciones</h2>
      </div>

      <p className={`mt-4 max-w-[38ch] text-[13px] leading-relaxed ${t.copy}`}>
        {COPY}
      </p>

      <div className="mt-auto flex flex-col gap-4 pt-6">
        <CountLine count={count} className={t.count} />
        <Cta className={t.cta} />
      </div>
    </div>
  )
}

function AnimatedBody({ count, hasCover }: BodyProps) {
  const t = tones(hasCover)
  return (
    <motion.div
      className="flex h-full flex-col"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
      <div>
        <motion.p
          variants={fadeUp}
          className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${t.eyebrow}`}
        >
          Academia
        </motion.p>
        <h2 className={`${TITLE_CLS} ${t.title} mt-3 overflow-hidden`}>
          <motion.span variants={maskUp} className="block will-change-transform">
            Cursos y certificaciones
          </motion.span>
        </h2>
      </div>

      <motion.p
        variants={fadeUp}
        className={`mt-4 max-w-[38ch] text-[13px] leading-relaxed ${t.copy}`}
      >
        {COPY}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-auto flex flex-col gap-4 pt-6">
        <CountLine count={count} className={t.count} />
        <Cta className={t.cta} />
      </motion.div>
    </motion.div>
  )
}

export default function AcademiaShowcaseIntro({
  count = 0,
  coverImage = "",
}: {
  count?: number
  coverImage?: string
}) {
  const reducedMotion = useReducedMotion()
  const hasCover = Boolean(coverImage)

  return (
    <Link href="/academia" className={CARD_CLS} aria-label="Ver toda la academia">
      {hasCover && (
        <>
          <SmoothImage
            src={coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 420px, (min-width: 640px) 380px, 82vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
          {/* Velo: la foto es un salón con mucho detalle. El tramo de en medio
              va casi tan oscuro como los extremos a propósito — ahí cae la
              pantalla del proyector, la zona más brillante, y es justo donde
              se apoya el párrafo. Con un via más claro el texto se perdía. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85"
          />
        </>
      )}

      <div className="relative z-10 flex h-full flex-col p-6 sm:p-7">
        {reducedMotion ? (
          <StaticBody count={count} hasCover={hasCover} />
        ) : (
          <AnimatedBody count={count} hasCover={hasCover} />
        )}
      </div>
    </Link>
  )
}
