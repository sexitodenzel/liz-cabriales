"use client"

import { usePathname } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import CurtainFooterSpacer from "./CurtainFooterSpacer"
import FooterStage from "./FooterStage"

/* El telón consume 1 viewport entero de scroll sin mostrar contenido nuevo.
   Con menos de 3 viewports de contenido esa fase domina la página: la franja
   negra aparece a media lista y el final es un viewport de vacío bajo el
   navbar (bug reportado en /academia). Bajo el umbral, footer en flujo. */
const CURTAIN_MIN_CONTENT_VIEWPORTS = 3

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setPrefersReduced(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  return prefersReduced
}

/* true si el contenido mide al menos N viewports. SSR/primer render asume que
   sí (coincide con el HTML del server); useLayoutEffect corrige antes del
   primer paint del cliente. ResizeObserver re-evalúa cuando el contenido
   crece/encoge (datos, imágenes, filtros) y en resize del viewport. */
function useContentSupportsCurtain(
  contentRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
): boolean {
  const [supportsCurtain, setSupportsCurtain] = useState(true)

  useLayoutEffect(() => {
    if (!enabled) return

    const el = contentRef.current
    if (!el) return

    const evaluate = () => {
      setSupportsCurtain(
        el.offsetHeight >= window.innerHeight * CURTAIN_MIN_CONTENT_VIEWPORTS,
      )
    }

    evaluate()
    const observer = new ResizeObserver(evaluate)
    observer.observe(el)
    window.addEventListener("resize", evaluate)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", evaluate)
    }
  }, [contentRef, enabled])

  return supportsCurtain
}

/** Flujos de reserva/pago: el cliente ya no explora; el footer estorba. */
function shouldHideFooter(pathname: string): boolean {
  if (pathname.startsWith("/servicios/agendar")) return true
  if (pathname.startsWith("/checkout")) return true
  if (pathname.startsWith("/orden/") || pathname === "/orden") return true
  if (pathname.startsWith("/cita/") || pathname === "/cita") return true
  if (pathname.includes("/inscripcion/")) return true
  return false
}

export default function SiteCurtainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const prefersReducedMotion = usePrefersReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const isAdmin = pathname.startsWith("/admin")
  const hideFooter = isAdmin || shouldHideFooter(pathname)
  const contentSupportsCurtain = useContentSupportsCurtain(
    contentRef,
    !hideFooter && !prefersReducedMotion,
  )

  if (hideFooter) {
    return (
      <div id="main-content" className="flex flex-1 flex-col bg-ivory">
        {children}
      </div>
    )
  }

  const curtain = !prefersReducedMotion && contentSupportsCurtain

  /* Misma forma de árbol en ambos modos (solo cambian clases y hermanos):
     alternar curtain/estático no desmonta la página. */
  return (
    <>
      {/* En modo curtain la caja de #site-curtain cubre al footer fijo (z-0)
          incluso donde solo está el spacer transparente, tragándose los clics
          del footer. pointer-events-none en el contenedor + auto en el
          contenido real deja pasar los clics solo en la zona del spacer. */}
      <div
        id="site-curtain"
        className={
          curtain
            ? "pointer-events-none relative z-[1] flex flex-1 flex-col"
            : "flex flex-1 flex-col"
        }
      >
        <div
          id="main-content"
          className={`flex flex-1 flex-col bg-ivory ${curtain ? "pointer-events-auto" : ""}`}
        >
          <div ref={contentRef} className="flex flex-1 flex-col">
            {children}
          </div>
          {!curtain && <FooterStage static />}
        </div>
        {curtain && <CurtainFooterSpacer />}
      </div>
      {curtain && <FooterStage />}
    </>
  )
}
