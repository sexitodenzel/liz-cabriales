"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"

import SmoothImage from "@/app/components/shared/SmoothImage"
import { EASE_OUT } from "@/lib/ease"

/* Portada del riel de academia: mismo footprint que CourseCard (aspect 3/4).
   Reparte el contenido de arriba (eyebrow + título) a abajo (CTA), con una
   línea de copy y chips en medio, para que la card no se sienta vacía. */

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

const CARD_CLS =
  "group relative flex aspect-[3/4] w-[82vw] shrink-0 flex-col overflow-hidden rounded-card bg-gradient-to-b from-[#f7f7f7] via-[#f2f2f2] to-[#eaeaea] sm:w-[380px] lg:w-[420px]"

const TITLE_CLS =
  "text-[clamp(26px,4.6vw,34px)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink"

const COLLAGE_MAX = 6

/* Salerita editorial: rejilla 3×2 de fotos de cursos pasados / eventos, para
   dar un vistazo real del ambiente de la academia. */
function Collage({ images }: { images: string[] }) {
  const shots = images.slice(0, COLLAGE_MAX)
  if (shots.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {shots.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-lg bg-neutral-200"
        >
          <SmoothImage
            src={src}
            alt=""
            fill
            sizes="120px"
            className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.06]"
          />
        </div>
      ))}
    </div>
  )
}

function Cta() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
      <span className="relative">
        Ver la academia
        <span
          className="absolute -bottom-0.5 left-0 h-px w-full bg-gold/40 transition-colors duration-300 group-hover:bg-gold"
          aria-hidden
        />
      </span>
      <span
        aria-hidden
        className="transition-transform duration-300 ease-out group-hover:translate-x-1"
      >
        →
      </span>
    </span>
  )
}

function CountLine({ count }: { count: number }) {
  if (count <= 0) return null
  const label = count === 1 ? "formación activa" : "formaciones activas"
  return (
    <p className="text-[11px] tabular-nums tracking-[0.08em] text-ink-soft">
      {count} {label}
    </p>
  )
}

type BodyProps = { count: number; images: string[] }

function StaticBody({ count, images }: BodyProps) {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Academia
        </p>
        <h2 className={`${TITLE_CLS} mt-3`}>Cursos y certificaciones</h2>
      </div>

      <p className="mt-4 max-w-[26ch] text-[13px] leading-relaxed text-ink-soft">
        Formaciones profesionales con certificación, diploma y cupo limitado.
      </p>

      <div className="mt-5">
        <Collage images={images} />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <CountLine count={count} />
        <Cta />
      </div>
    </div>
  )
}

function AnimatedBody({ count, images }: BodyProps) {
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
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft"
        >
          Academia
        </motion.p>
        <h2 className={`${TITLE_CLS} mt-3 overflow-hidden`}>
          <motion.span variants={maskUp} className="block will-change-transform">
            Cursos y certificaciones
          </motion.span>
        </h2>
      </div>

      <motion.p
        variants={fadeUp}
        className="mt-4 max-w-[26ch] text-[13px] leading-relaxed text-ink-soft"
      >
        Formaciones profesionales con certificación, diploma y cupo limitado.
      </motion.p>

      <motion.div variants={fadeUp} className="mt-5">
        <Collage images={images} />
      </motion.div>

      <motion.div variants={fadeUp} className="mt-auto flex flex-col gap-3 pt-4">
        <CountLine count={count} />
        <Cta />
      </motion.div>
    </motion.div>
  )
}

export default function AcademiaShowcaseIntro({
  count = 0,
  images = [],
}: {
  count?: number
  images?: string[]
}) {
  const reducedMotion = useReducedMotion()

  return (
    <Link href="/academia" className={CARD_CLS} aria-label="Ver toda la academia">
      <div className="relative z-10 flex h-full flex-col p-6 sm:p-7">
        {reducedMotion ? (
          <StaticBody count={count} images={images} />
        ) : (
          <AnimatedBody count={count} images={images} />
        )}
      </div>
    </Link>
  )
}
