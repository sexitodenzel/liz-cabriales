"use client"

import { useEffect, useState } from "react"

export const SEARCH_TYPEWRITER_PHRASES = [
  "¿Qué estás buscando?",
  "Sigue buscando con lizcabriales.com",
  "Todo lo que ocupas en un solo lugar",
  "Encuentra lo que necesitas para tus uñas",
] as const

const TYPE_MS = 58
const DELETE_MS = 36
const PAUSE_MS = 2000

export function useTypewriterPhrases(
  active: boolean,
  phrases: readonly string[] = SEARCH_TYPEWRITER_PHRASES
) {
  const [display, setDisplay] = useState("")
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!active) {
      setDisplay("")
      setPhraseIndex(0)
      setCharIndex(0)
      setIsDeleting(false)
      return
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
      const timer = setTimeout(() => setIsDeleting(true), PAUSE_MS)
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

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false)
      setPhraseIndex((current) => (current + 1) % phrases.length)
    }
  }, [active, phraseIndex, charIndex, isDeleting, phrases])

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
    <span
      className={className}
      aria-hidden
    >
      {text}
      <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[0.06em] animate-pulse bg-neutral-400 align-middle" />
    </span>
  )
}
