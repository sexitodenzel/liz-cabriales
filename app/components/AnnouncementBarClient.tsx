"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

type AnnouncementItem = {
  id: string
  label: string
  href: string | null
}

type Props = {
  items: AnnouncementItem[]
}

export default function AnnouncementBarClient({ items }: Props) {
  const pathname = usePathname()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const total = items.length

  if (pathname !== "/") return null

  function go(step: 1 | -1) {
    setDirection(step === 1 ? "next" : "prev")
    setIndex((prev) => (prev + step + total) % total)
  }

  const current = items[index]
  const animationClass =
    direction === "next" ? "announcement-slide-next" : "announcement-slide-prev"

  return (
    <div id="site-announcement-bar" className="relative z-[60] w-full bg-black text-white" aria-label="Anuncios">
      <div className="flex h-9 w-full items-center justify-center gap-6 px-4 sm:gap-10">
        {total > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            className="grid h-6 w-6 shrink-0 place-items-center text-white/80 transition-colors hover:text-white"
            aria-label="Anuncio anterior"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="relative inline-grid items-center justify-items-center overflow-hidden">
          {/* Ghost layer: reserva el ancho del slide más largo para que las flechas no se muevan */}
          <div aria-hidden className="invisible col-start-1 row-start-1 grid">
            {items.map((item) => (
              <span
                key={item.id}
                className="col-start-1 row-start-1 whitespace-nowrap text-[12px] tracking-[0.06em] sm:text-[13px]"
              >
                {item.label}
              </span>
            ))}
          </div>
          {/* Slide activo */}
          <div
            key={index}
            className={`col-start-1 row-start-1 flex items-center justify-center ${animationClass}`}
          >
            {current.href ? (
              <Link
                href={current.href}
                className="whitespace-nowrap text-[12px] tracking-[0.06em] text-white transition-opacity hover:opacity-80 sm:text-[13px]"
              >
                {current.label}
              </Link>
            ) : (
              <span className="whitespace-nowrap text-[12px] tracking-[0.06em] text-white sm:text-[13px]">
                {current.label}
              </span>
            )}
          </div>
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            className="grid h-6 w-6 shrink-0 place-items-center text-white/80 transition-colors hover:text-white"
            aria-label="Siguiente anuncio"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
