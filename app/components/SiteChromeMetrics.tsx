"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const CHROME_BOTTOM_VAR = "--site-chrome-bottom"
const NAVBAR_ID = "site-navbar"

function findNavbar(): HTMLElement | null {
  // Durante el streaming puede haber DOS #site-navbar: el fallback del Suspense
  // y la copia ya renderizada dentro de <div hidden id="S:x">. Nos quedamos con
  // el que está realmente pintado.
  const candidates = document.querySelectorAll<HTMLElement>(`#${NAVBAR_ID}`)
  return (
    Array.from(candidates).find((el) => el.offsetParent !== null) ??
    candidates[0] ??
    null
  )
}

function measureChromeBottom(navbar: HTMLElement | null): number {
  if (!navbar) return 0
  const rect = navbar.getBoundingClientRect()
  return Math.round(Math.max(0, Math.min(window.innerHeight, rect.bottom)))
}

export default function SiteChromeMetrics() {
  const pathname = usePathname()

  useEffect(() => {
    let observed: HTMLElement | null = null
    const resizeObserver = new ResizeObserver(() => sync())

    // El header se REEMPLAZA cuando resuelve el Suspense del layout (el fallback
    // sin barra de anuncios da paso al real, 36px más alto). Si nos quedáramos
    // con la referencia del mount, el ResizeObserver seguiría mirando un nodo
    // desconectado y la var quedaría 36px corta hasta el primer scroll.
    // La compresión del chrome es un `transform` de 360ms y el scroll solo se
    // muestrea mientras el dedo se mueve: si el gesto termina a media
    // transición, la var se congelaba a mitad de camino. El panel de búsqueda
    // se ancla a ella y al abrirlo se bloquea el scroll, así que el desfase ya
    // no se corregía solo.
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName === "transform") sync()
    }

    const sync = () => {
      const navbar = findNavbar()
      if (navbar !== observed) {
        if (observed) {
          resizeObserver.unobserve(observed)
          observed.removeEventListener("transitionend", onTransitionEnd)
        }
        if (navbar) {
          resizeObserver.observe(navbar)
          navbar.addEventListener("transitionend", onTransitionEnd)
        }
        observed = navbar
      }
      document.documentElement.style.setProperty(
        CHROME_BOTTOM_VAR,
        `${measureChromeBottom(navbar)}px`,
      )
    }

    sync()

    // Solo hijos DIRECTOS de <body>: ahí es donde vive el header y donde React
    // hace el swap del boundary. Con subtree: true esto se dispararía en cada
    // inserción de la app y cada callback fuerza layout (getBoundingClientRect).
    const mutationObserver = new MutationObserver(sync)
    mutationObserver.observe(document.body, { childList: true })

    window.addEventListener("scroll", sync, { passive: true })
    window.addEventListener("resize", sync)

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      observed?.removeEventListener("transitionend", onTransitionEnd)
      window.removeEventListener("scroll", sync)
      window.removeEventListener("resize", sync)
    }
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const navbar = findNavbar()
      document.documentElement.style.setProperty(
        CHROME_BOTTOM_VAR,
        `${measureChromeBottom(navbar)}px`,
      )
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return null
}
