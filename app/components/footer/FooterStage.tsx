"use client"

import { usePathname } from "next/navigation"
import { useRef } from "react"

import Footer from "../Footer"
import { useFooterStageHeight } from "./useFooterStageHeight"
import { useFooterStageReveal } from "./useFooterStageReveal"

type FooterStageProps = {
  static?: boolean
}

export default function FooterStage({
  static: isStatic = false,
}: FooterStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useFooterStageHeight(stageRef, !isStatic, pathname)
  useFooterStageReveal(stageRef, !isStatic)

  if (isStatic) {
    /* Aún en flujo (páginas cortas / reduce-motion) mostramos el wordmark
       grande "Liz Cabriales Studio": el telón fijo no aplica, pero la sección
       grandota sí debe aparecer en todas las páginas. */
    return <Footer expanded />
  }

  return (
    <div
      id="site-footer-stage"
      ref={stageRef}
      className="invisible fixed inset-x-0 bottom-0 z-0 flex min-h-[100dvh] flex-col justify-end bg-[#0a0a0a]"
    >
      <Footer expanded />
    </div>
  )
}
