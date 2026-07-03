"use client"

import { motion, useReducedMotion, useSpring, useTransform } from "motion/react"
import { useEffect } from "react"

import { cn } from "@/lib/utils"

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Overshoot suave al rodar (mass bajo evita rebote largo en cambios de +1).
const SPRING = { stiffness: 280, damping: 24, mass: 0.4 }

function DigitColumn({ value }: { value: number }) {
  const spring = useSpring(value, SPRING)

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  const y = useTransform(spring, (v) => `${-v * 10}%`)

  return (
    <span className="relative inline-block h-[1em] overflow-hidden">
      <span className="invisible block h-[1em]">0</span>
      <motion.span className="absolute left-0 top-0 w-full" style={{ y }}>
        {DIGITS.map((digit) => (
          <span key={digit} className="block h-[1em] text-center">
            {digit}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

type Props = {
  value: number
  /** Formatea el valor antes de renderear (ej. formatMXN). Los caracteres
   *  no numéricos ($, comas, punto decimal) quedan estáticos. */
  format?: (value: number) => string
  className?: string
}

/**
 * Número cuyos dígitos ruedan verticalmente al cambiar (badge del carrito,
 * totales). Cada dígito se anima en su columna; se llavean desde las unidades
 * para que un cambio de 99→100 no re-monte toda la cifra.
 */
export default function SlidingNumber({ value, format, className }: Props) {
  const reducedMotion = useReducedMotion()
  const text = format ? format(value) : String(value)

  if (reducedMotion) {
    return <span className={cn("tabular-nums", className)}>{text}</span>
  }

  let digitIndex = 0
  const nodes = text
    .split("")
    .reverse()
    .map((char, i) => {
      if (/\d/.test(char)) {
        return <DigitColumn key={`d-${digitIndex++}`} value={Number(char)} />
      }
      return (
        <span key={`s-${i}`} className="block h-[1em]">
          {char}
        </span>
      )
    })
    .reverse()

  return (
    <span className={cn("inline-flex leading-none tabular-nums", className)} aria-label={text}>
      <span aria-hidden className="contents">
        {nodes}
      </span>
    </span>
  )
}
