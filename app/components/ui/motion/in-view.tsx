"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

import { EASE_OUT } from "@/lib/ease"

type Props = {
  children: ReactNode
  className?: string
  delay?: number
}

/**
 * Reveal sutil al entrar al viewport: solo fade + translate (nunca scale en
 * texto). Anima una vez y respeta prefers-reduced-motion.
 */
export default function InView({ children, className, delay = 0 }: Props) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  )
}
