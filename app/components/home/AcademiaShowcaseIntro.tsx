"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { EASE_OUT } from "@/lib/ease"

/* Primera card del riel de academia: mismo footprint que CourseCard
   (aspect 3/4). Solo eyebrow + título; toda la card enlaza a /academia. */

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
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

function CardBody({ animated }: { animated: boolean }) {
  if (!animated) {
    return (
      <>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Academia
        </p>
        <h2 className={`${TITLE_CLS} mt-3`}>Cursos y certificaciones</h2>
      </>
    )
  }

  return (
    <motion.div
      className="flex h-full flex-col"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
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
    </motion.div>
  )
}

export default function AcademiaShowcaseIntro() {
  const reducedMotion = useReducedMotion()

  return (
    <Link href="/academia" className={CARD_CLS} aria-label="Ver toda la academia">
      <div className="relative z-10 flex h-full flex-col p-6 sm:p-7">
        <CardBody animated={!reducedMotion} />
      </div>
    </Link>
  )
}
