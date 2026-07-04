"use client"

import { useEffect } from "react"

/* El stage es una capa fija negra detrás de TODO el documento. Con scroll muy
   rápido tras un refresh, el compositor de Chrome muestra tiles del contenido
   aún sin rasterizar como transparentes, y el negro del stage se asomaba en
   franjas a media página. Mantenerlo visibility:hidden salvo cerca del final
   hace que esos tiles vacíos revelen el fondo blanco del body, no el footer. */
export function useFooterStageReveal(
  stageRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return

    const stage = stageRef.current
    const sentinel = document.getElementById("footer-reveal-sentinel")
    if (!stage || !sentinel) return

    /* Mientras el documento sigue streameando, "cerca del final" es un dato
       falso: el final actual es provisional y el scroll clavado al fondo del
       doc corto revelaría el stage a media página. Hasta el load, oculto. */
    let loaded = document.readyState === "complete"
    let nearEnd = false

    const apply = () => {
      stage.style.visibility = loaded && nearEnd ? "visible" : "hidden"
    }

    const onLoad = () => {
      loaded = true
      apply()
    }
    window.addEventListener("load", onLoad)

    const observer = new IntersectionObserver(
      ([entry]) => {
        // El spacer con altura 0 (aún sin medir) nunca revela nada.
        nearEnd = entry.isIntersecting && entry.boundingClientRect.height > 0
        apply()
      },
      // 2 viewports de margen: buffer de sobra para que el footer ya esté
      // visible cuando el telón lo revele, incluso en flings agresivos.
      { rootMargin: "200% 0px 200% 0px" },
    )
    observer.observe(sentinel)

    return () => {
      window.removeEventListener("load", onLoad)
      observer.disconnect()
    }
  }, [stageRef, enabled])
}
