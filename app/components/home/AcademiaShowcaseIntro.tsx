"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { ArrowRightIcon } from "@/app/components/ui/icons"
import { EASE_OUT } from "@/lib/ease"

/* Panel de texto (izquierda) del showcase de academia. Reveal editorial estilo
   Dior: el texto entra "oculto → aparece" (máscara clip en el título, fade-up
   escalonado en lo demás) cuando la sección entra al viewport. Respeta
   prefers-reduced-motion. Título en sans (Outfit) — NADA de serif aquí. */

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
}

const maskUp: Variants = {
  hidden: { y: "115%" },
  show: { y: 0, transition: { duration: 0.75, ease: EASE_OUT } },
}

const TITLE_CLS =
  "text-[clamp(28px,3.6vw,42px)] font-semibold leading-[1.06] tracking-[-0.02em] text-ink"

export default function AcademiaShowcaseIntro() {
  const reducedMotion = useReducedMotion()

  const title = (
    <>
      Cursos y <span className="text-gold">certificaciones</span>
    </>
  )

  if (reducedMotion) {
    return (
      <div className="max-w-[420px] pr-[var(--site-px)] lg:pr-0">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          Academia
        </p>
        <h2 className={TITLE_CLS}>{title}</h2>
        <div className="mt-5 h-0.5 w-16 bg-gold-soft" aria-hidden />
        <p className="mt-5 max-w-[400px] text-[15px] leading-[1.65] text-ink-soft">
          Formación presencial y online en onicotecnia, pedicura y quiropodia.
          Más de 7 años preparando profesionales de éxito desde Tampico.
        </p>
        <Cta />
      </div>
    )
  }

  return (
    <motion.div
      className="max-w-[420px] pr-[var(--site-px)] lg:pr-0"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -100px 0px" }}
    >
      <motion.p
        variants={fadeUp}
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold"
      >
        Academia
      </motion.p>
      <h2 className={`${TITLE_CLS} overflow-hidden`}>
        <motion.span variants={maskUp} className="block will-change-transform">
          {title}
        </motion.span>
      </h2>
      <motion.div variants={fadeUp} className="mt-5 h-0.5 w-16 bg-gold-soft" aria-hidden />
      <motion.p
        variants={fadeUp}
        className="mt-5 max-w-[400px] text-[15px] leading-[1.65] text-ink-soft"
      >
        Formación presencial y online en onicotecnia, pedicura y quiropodia.
        Más de 7 años preparando profesionales de éxito desde Tampico.
      </motion.p>
      <motion.div variants={fadeUp}>
        <Cta />
      </motion.div>
    </motion.div>
  )
}

function Cta() {
  return (
    <Link
      href="/academia"
      className="group mt-7 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold transition-colors duration-300 hover:text-ink"
    >
      Ver toda la academia
      <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
        <ArrowRightIcon />
      </span>
    </Link>
  )
}
