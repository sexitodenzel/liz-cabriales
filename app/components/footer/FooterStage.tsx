"use client"

import { usePathname } from "next/navigation"
import { useRef } from "react"

import Footer from "../Footer"
import { useFooterStageHeight } from "./useFooterStageHeight"

type FooterStageProps = {
  static?: boolean
}

export default function FooterStage({
  static: isStatic = false,
}: FooterStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useFooterStageHeight(stageRef, !isStatic, pathname)

  if (isStatic) {
    return <Footer />
  }

  return (
    <div
      id="site-footer-stage"
      ref={stageRef}
      className="fixed inset-x-0 bottom-0 z-0"
    >
      <Footer />
    </div>
  )
}
