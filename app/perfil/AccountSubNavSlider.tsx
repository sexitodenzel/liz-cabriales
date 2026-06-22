"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { accountSubNavRowClass } from "./AccountSubNavTab"

type AccountSubNavSliderProps = {
  activeId: string
  children: ReactNode
  className?: string
}

export default function AccountSubNavSlider({
  activeId,
  children,
  className,
}: AccountSubNavSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const updateIndicator = useCallback(() => {
    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return

    const activeEl = scroll.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`)
    if (!activeEl) {
      setIndicator({ left: 0, width: 0 })
      return
    }

    const trackRect = track.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const left = activeRect.left - trackRect.left
    const width = activeRect.width
    const maxLeft = Math.max(0, trackRect.width - width)

    setIndicator({
      left: Math.max(0, Math.min(left, maxLeft)),
      width,
    })
  }, [activeId])

  useEffect(() => {
    updateIndicator()

    const scroll = scrollRef.current
    if (!scroll) return

    const observer = new ResizeObserver(updateIndicator)
    observer.observe(scroll)
    if (trackRef.current) observer.observe(trackRef.current)
    scroll.querySelectorAll("[data-nav-id]").forEach((el) => observer.observe(el))

    const onScroll = () => {
      window.requestAnimationFrame(updateIndicator)
    }

    scroll.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", updateIndicator)

    return () => {
      observer.disconnect()
      scroll.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateIndicator)
    }
  }, [updateIndicator])

  useEffect(() => {
    const scroll = scrollRef.current
    if (!scroll) return

    const activeEl = scroll.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`)
    activeEl?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" })

    const frame = window.requestAnimationFrame(updateIndicator)
    return () => window.cancelAnimationFrame(frame)
  }, [activeId, updateIndicator])

  return (
    <div className={className}>
      <div className="site-container">
        <div ref={scrollRef} className={`${accountSubNavRowClass} py-4`}>
          {children}
        </div>
      </div>
      <div ref={trackRef} className="relative h-px w-full overflow-hidden bg-neutral-200">
        {indicator.width > 0 ? (
          <>
            <div
              className="absolute -top-px h-0.5 bg-neutral-900 transition-[left,width] duration-250 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
              aria-hidden="true"
            />
            <div
              className="absolute -top-[7px] h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-neutral-900 transition-[left] duration-250 ease-out"
              style={{ left: indicator.left + indicator.width / 2 - 5 }}
              aria-hidden="true"
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
