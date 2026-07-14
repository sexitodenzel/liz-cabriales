"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      className="h-5 w-5">
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  )
}

function ChevLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      className="h-5 w-5">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      className="h-5 w-5">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

/**
 * Lightbox de imagen a pantalla completa. Muestra la imagen COMPLETA
 * (object-contain) sobre un fondo oscuro difuminado, con X y flechas blancas
 * sin fondo circular. Se renderiza vía portal a <body> para escapar de los
 * stacking contexts de la página (telón/stage con transform) y quedar por
 * encima del navbar.
 */
export default function ImageLightbox({
  images,
  startIndex = 0,
  alt = "",
  onClose,
}: {
  images: string[]
  startIndex?: number
  alt?: string
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)

  // En móvil un "ghost click" ~300ms tras el toque caería sobre el overlay
  // recién montado y lo cerraría solo; ignoramos cierres dentro de esa ventana.
  const openedAtRef = useRef(0)

  const n = images.length
  const prev = useCallback(() => setIdx((i) => (i - 1 + n) % n), [n])
  const next = useCallback(() => setIdx((i) => (i + 1) % n), [n])
  const guardedClose = useCallback(() => {
    if (Date.now() - openedAtRef.current < 400) return
    onClose()
  }, [onClose])

  useEffect(() => {
    openedAtRef.current = Date.now()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  // Solo se monta por interacción en cliente; nunca en SSR.
  if (typeof document === "undefined" || n === 0) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={guardedClose}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center text-white/80 transition-colors hover:text-white"
      >
        <CloseIcon />
      </button>

      {n > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          aria-label="Anterior"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center text-white/80 transition-colors hover:text-white"
        >
          <ChevLeft />
        </button>
      )}

      {n > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          aria-label="Siguiente"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center text-white/80 transition-colors hover:text-white"
        >
          <ChevRight />
        </button>
      )}

      <div className="relative mx-4 flex max-h-[90vh] flex-col items-center sm:mx-16" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={alt}
          className="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl sm:max-w-[80vw]"
        />
      </div>
    </div>,
    document.body,
  )
}
