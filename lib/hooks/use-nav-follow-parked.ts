"use client"

import { useEffect, useRef } from "react"

/**
 * Complemento de `.navbar-follow-collapse` para stickies con FIN DE RECORRIDO
 * (sidebar de curso/producto): cuando el elemento agota el scroll de su
 * columna se "estaciona" en el borde inferior del contenedor y viaja con el
 * contenido — ahí ya no está pegado a su línea `top`, y el translate de -56px
 * del follow lo dejaría descansando 56px arriba del borde de la columna.
 *
 * Este hook marca `.lc-follow-parked` cuando la posición de LAYOUT del sticky
 * (sin su transform) cae por debajo de su `top` resuelto, y CSS (globals)
 * regresa el transform a 0 con la misma transición. Solo mide en ≥1200px,
 * la única zona con colapso de navbar.
 */
export function useNavFollowParked<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia) return
    const mq = window.matchMedia("(min-width: 1200px)")
    // `top` sticky resuelto en px; constante dentro de cada breakpoint.
    let stickyTop = 0

    const measureStickyTop = () => {
      stickyTop = parseFloat(getComputedStyle(el).top) || 0
    }

    const update = () => {
      if (!mq.matches) {
        el.classList.remove("lc-follow-parked")
        return
      }
      // Posición de layout: el rect incluye el translate del follow (incluso
      // a media transición), así que se descuenta. Pegado ≡ top ≈ stickyTop;
      // estacionado ≡ el contenedor ya lo arrastra por encima de la línea.
      let top = el.getBoundingClientRect().top
      const transform = getComputedStyle(el).transform
      if (transform && transform !== "none") {
        top -= new DOMMatrixReadOnly(transform).m42
      }
      el.classList.toggle("lc-follow-parked", top < stickyTop - 2)
    }

    const remeasure = () => {
      measureStickyTop()
      update()
    }

    remeasure()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", remeasure)
    mq.addEventListener?.("change", remeasure)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", remeasure)
      mq.removeEventListener?.("change", remeasure)
      el.classList.remove("lc-follow-parked")
    }
  }, [])

  return ref
}
