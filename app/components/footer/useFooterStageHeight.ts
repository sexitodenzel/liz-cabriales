"use client"

import { useEffect } from "react"

const FOOTER_HEIGHT_VAR = "--footer-stage-h"

export function useFooterStageHeight(
  stageRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  remeasureKey?: string,
) {
  useEffect(() => {
    if (!enabled) {
      document.documentElement.style.setProperty(FOOTER_HEIGHT_VAR, "0px")
      return
    }

    const el = stageRef.current
    if (!el) return

    const sync = () => {
      const height = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty(FOOTER_HEIGHT_VAR, `${height}px`)
    }

    sync()
    const raf = requestAnimationFrame(sync)

    const resizeObserver = new ResizeObserver(sync)
    resizeObserver.observe(el)
    window.addEventListener("resize", sync)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener("resize", sync)
      document.documentElement.style.setProperty(FOOTER_HEIGHT_VAR, "0px")
    }
  }, [stageRef, enabled, remeasureKey])
}
