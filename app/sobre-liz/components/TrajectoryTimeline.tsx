"use client"

import { useRef, useState } from "react"

export type TimelineBullet = {
  readonly label: string
  readonly text: string
}

export type TimelineItem = {
  readonly year: string
  readonly title: string
  readonly description: string
  readonly bullets?: readonly TimelineBullet[]
}

/**
 * Línea de tiempo interactiva (patrón tabs): riel horizontal de años + un solo
 * panel visible a la vez. Todos los paneles quedan en el DOM (SEO/lectores de
 * pantalla) y solo se ocultan con `hidden`; la clase lc-mega-panel-in se
 * re-aplica al panel activo para reproducir el fade al cambiar de año.
 */
export default function TrajectoryTimeline({
  items,
}: {
  items: readonly TimelineItem[]
}) {
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const n = items.length
  // Los tabs son flex-1: el centro del punto i cae en (i + 0.5) / n del ancho.
  const edgeInset = 100 / (2 * n)

  const select = (index: number, focus = false) => {
    const next = Math.max(0, Math.min(n - 1, index))
    setActive(next)
    const tab = tabRefs.current[next]
    if (!tab) return
    if (focus) tab.focus({ preventScroll: true })
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    tab.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    })
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      select(active + 1, true)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      select(active - 1, true)
    } else if (event.key === "Home") {
      event.preventDefault()
      select(0, true)
    } else if (event.key === "End") {
      event.preventDefault()
      select(n - 1, true)
    }
  }

  return (
    <div>
      {/* ── Riel de años ── */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label="Años de trayectoria"
          onKeyDown={onKeyDown}
          className="relative flex min-w-[480px] items-start"
        >
          <div
            className="absolute top-[5px] h-0.5 rounded-full bg-[#c6a75e]/20"
            style={{ left: `${edgeInset}%`, right: `${edgeInset}%` }}
            aria-hidden
          />
          <div
            className="absolute top-[5px] h-0.5 origin-left rounded-full bg-[#c6a75e] transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{
              left: `${edgeInset}%`,
              width: `${100 - 2 * edgeInset}%`,
              transform: `scaleX(${n > 1 ? active / (n - 1) : 0})`,
            }}
            aria-hidden
          />
          {items.map((item, index) => {
            const isActive = index === active
            return (
              <button
                key={item.year}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                type="button"
                role="tab"
                id={`trayectoria-tab-${item.year}`}
                aria-selected={isActive}
                aria-controls={`trayectoria-panel-${item.year}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(index)}
                className="group relative z-10 flex flex-1 flex-col items-center gap-2.5 pb-1"
              >
                <span
                  className={`block h-3 w-3 rounded-full border-2 transition-colors duration-300 ${
                    isActive
                      ? "border-[#c6a75e] bg-[#c6a75e] shadow-[0_0_0_4px_rgba(198,167,94,0.18)]"
                      : "border-[#c6a75e]/40 bg-ivory group-hover:border-[#c6a75e]"
                  }`}
                  aria-hidden
                />
                <span
                  className={`font-display text-[15px] leading-none transition-colors duration-300 sm:text-[17px] ${
                    isActive ? "font-medium text-gold" : "text-[#6b6b6b] group-hover:text-[#111]"
                  }`}
                >
                  {item.year}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Panel del año activo ── */}
      <div className="mt-6 rounded-2xl border border-[#c6a75e]/15 bg-white p-6 sm:p-8 lg:min-h-[300px] lg:p-10">
        {items.map((item, index) => {
          const isActive = index === active
          return (
            <div
              key={item.year}
              role="tabpanel"
              id={`trayectoria-panel-${item.year}`}
              aria-labelledby={`trayectoria-tab-${item.year}`}
              hidden={!isActive}
            >
              <div
                className={
                  isActive
                    ? "lc-mega-panel-in grid gap-5 lg:grid-cols-[minmax(0,180px)_1fr] lg:gap-12"
                    : "grid gap-5 lg:grid-cols-[minmax(0,180px)_1fr] lg:gap-12"
                }
              >
                <div>
                  <p className="font-display text-[44px] font-medium leading-none text-gold lg:text-[64px]">
                    {item.year}
                  </p>
                  <div className="mt-4 hidden h-0.5 w-12 bg-[#c6a75e] lg:block" aria-hidden />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold leading-snug text-[#111] lg:text-[19px]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.7] text-[#4b4b4b]">
                    {item.description}
                  </p>
                  {item.bullets ? (
                    <ul className="mt-4 flex max-w-2xl flex-col gap-2.5">
                      {item.bullets.map((bullet) => (
                        <li
                          key={bullet.label}
                          className="relative pl-4 text-[14.5px] leading-[1.7] text-[#4b4b4b]"
                        >
                          <span
                            className="absolute left-0 top-[9px] block h-1.5 w-1.5 rounded-full bg-[#c6a75e]"
                            aria-hidden
                          />
                          <span className="font-semibold text-[#111]">{bullet.label}</span>{" "}
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}

        {/* ── Controles ── */}
        <div className="mt-7 flex items-center justify-between border-t border-[#c6a75e]/15 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b]">
            <span className="text-gold">{String(active + 1).padStart(2, "0")}</span>
            {" / "}
            {String(n).padStart(2, "0")}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => select(active - 1)}
              disabled={active === 0}
              aria-label="Año anterior"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c6a75e]/40 text-gold transition-colors hover:bg-[#c6a75e]/10 disabled:cursor-default disabled:border-[#c6a75e]/15 disabled:text-[#c6a75e]/30 disabled:hover:bg-transparent"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rotate-180"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => select(active + 1)}
              disabled={active === n - 1}
              aria-label="Año siguiente"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c6a75e]/40 text-gold transition-colors hover:bg-[#c6a75e]/10 disabled:cursor-default disabled:border-[#c6a75e]/15 disabled:text-[#c6a75e]/30 disabled:hover:bg-transparent"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
