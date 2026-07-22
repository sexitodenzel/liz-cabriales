"use client"

import { useEffect, useState } from "react"

/** Frases del typewriter (ortografía corregida). */
export const SEARCH_TYPEWRITER_PHRASES = [
  "Compra en lizcabriales.com",
  "Explora nuestro módulo de tienda",
  "Todo lo que necesitas para tus uñas está aquí",
  "Explora nuestros diferentes servicios",
] as const

const IDLE_LABEL = "Buscar"
const TYPE_MS = 55
const DELETE_MS = 32
const PAUSE_AFTER_PHRASE_MS = 1800
const IDLE_HOLD_MS = 15_000

export function useTypewriterPhrases(
  active: boolean,
  phrases: readonly string[] = SEARCH_TYPEWRITER_PHRASES
) {
  const [display, setDisplay] = useState("")
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  /** Tras el ciclo de frases, se muestra "Buscar" 15s. */
  const [isIdleHold, setIsIdleHold] = useState(false)

  useEffect(() => {
    if (!active) {
      setDisplay("")
      setPhraseIndex(0)
      setCharIndex(0)
      setIsDeleting(false)
      setIsIdleHold(false)
      return
    }

    if (isIdleHold) {
      setDisplay(IDLE_LABEL)
      const timer = setTimeout(() => {
        setIsIdleHold(false)
        setPhraseIndex(0)
        setCharIndex(0)
        setIsDeleting(false)
        setDisplay("")
      }, IDLE_HOLD_MS)
      return () => clearTimeout(timer)
    }

    const phrase = phrases[phraseIndex] ?? phrases[0]

    if (!isDeleting && charIndex < phrase.length) {
      const timer = setTimeout(() => {
        const next = charIndex + 1
        setCharIndex(next)
        setDisplay(phrase.slice(0, next))
      }, TYPE_MS)
      return () => clearTimeout(timer)
    }

    if (!isDeleting && charIndex >= phrase.length) {
      const timer = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_PHRASE_MS)
      return () => clearTimeout(timer)
    }

    if (isDeleting && charIndex > 0) {
      const timer = setTimeout(() => {
        const next = charIndex - 1
        setCharIndex(next)
        setDisplay(phrase.slice(0, next))
      }, DELETE_MS)
      return () => clearTimeout(timer)
    }

    // Terminó de borrar la frase actual
    if (isDeleting && charIndex === 0) {
      const isLast = phraseIndex >= phrases.length - 1
      if (isLast) {
        setIsIdleHold(true)
        setDisplay(IDLE_LABEL)
        setIsDeleting(false)
      } else {
        setIsDeleting(false)
        setPhraseIndex((current) => current + 1)
      }
    }
  }, [active, phraseIndex, charIndex, isDeleting, isIdleHold, phrases])

  return display
}

type SearchTypewriterProps = {
  active: boolean
  className?: string
}

export function SearchTypewriter({ active, className }: SearchTypewriterProps) {
  const text = useTypewriterPhrases(active)

  if (!active) return null

  return (
    <span className={className} aria-hidden>
      {text}
      <span className="ml-px inline-block h-[1.1em] w-[1.5px] translate-y-[0.06em] animate-pulse bg-current align-middle opacity-70" />
    </span>
  )
}
