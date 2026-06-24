"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import CurtainFooterSpacer from "./CurtainFooterSpacer"
import FooterStage from "./FooterStage"

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

export default function SiteCurtainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const prefersReducedMotion = usePrefersReducedMotion()

  if (pathname.startsWith("/admin")) {
    return <div className="flex flex-1 flex-col">{children}</div>
  }

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-1 flex-col">
        {children}
        <FooterStage static />
      </div>
    )
  }

  return (
    <>
      <div
        id="site-curtain"
        className="relative z-[1] flex flex-1 flex-col"
        style={{
          background:
            "linear-gradient(to bottom, #ffffff calc(100% - var(--footer-stage-h, 0px)), transparent calc(100% - var(--footer-stage-h, 0px)))",
        }}
      >
        <div className="flex flex-1 flex-col">{children}</div>
        <CurtainFooterSpacer />
      </div>
      <FooterStage />
    </>
  )
}
