"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { accountSubNavRowClass } from "./AccountSubNavTab"

type AccountSubNavSliderProps = {
  activeId: string
  children: ReactNode
  className?: string
}

const TRIANGLE_HALF = 5

export default function AccountSubNavSlider({
  activeId,
  children,
  className,
}: AccountSubNavSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [pointerLeft, setPointerLeft] = useState<number | null>(null)
  const [thumb, setThumb] = useState({ left: 0, width: 0, visible: false })
  const dragStateRef = useRef<{
    pointerId: number
    startClientX: number
    startScrollLeft: number
    trackInner: number
    scrollRange: number
  } | null>(null)

  const updatePointer = useCallback(() => {
    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return

    const activeEl = scroll.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`)
    if (!activeEl) {
      setPointerLeft(null)
      return
    }

    const trackRect = track.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const center = activeRect.left + activeRect.width / 2 - trackRect.left
    const clamped = Math.max(
      TRIANGLE_HALF,
      Math.min(trackRect.width - TRIANGLE_HALF, center)
    )
    setPointerLeft(clamped - TRIANGLE_HALF)
  }, [activeId])

  const updateThumb = useCallback(() => {
    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return

    const trackWidth = track.clientWidth
    const visibleRatio = scroll.clientWidth / Math.max(scroll.scrollWidth, 1)
    if (visibleRatio >= 0.999) {
      setThumb({ left: 0, width: 0, visible: false })
      return
    }

    const minThumb = 32
    const thumbWidth = Math.max(minThumb, Math.round(trackWidth * visibleRatio))
    const scrollRange = Math.max(1, scroll.scrollWidth - scroll.clientWidth)
    const progress = scroll.scrollLeft / scrollRange
    const left = Math.round(progress * (trackWidth - thumbWidth))
    setThumb({ left, width: thumbWidth, visible: true })
  }, [])

  const updateAll = useCallback(() => {
    updatePointer()
    updateThumb()
  }, [updatePointer, updateThumb])

  useEffect(() => {
    updateAll()

    const scroll = scrollRef.current
    if (!scroll) return

    const observer = new ResizeObserver(updateAll)
    observer.observe(scroll)
    if (trackRef.current) observer.observe(trackRef.current)
    scroll.querySelectorAll("[data-nav-id]").forEach((el) => observer.observe(el))

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        updateAll()
      })
    }

    scroll.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", updateAll)

    return () => {
      observer.disconnect()
      scroll.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateAll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [updateAll])

  useEffect(() => {
    const scroll = scrollRef.current
    if (!scroll) return

    const activeEl = scroll.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`)
    activeEl?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" })

    const frame = window.requestAnimationFrame(updateAll)
    return () => window.cancelAnimationFrame(frame)
  }, [activeId, updateAll])

  const onThumbPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const scroll = scrollRef.current
      const track = trackRef.current
      if (!scroll || !track) return
      e.preventDefault()
      e.stopPropagation()
      const trackInner = Math.max(1, track.clientWidth - thumb.width)
      const scrollRange = Math.max(1, scroll.scrollWidth - scroll.clientWidth)
      dragStateRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startScrollLeft: scroll.scrollLeft,
        trackInner,
        scrollRange,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [thumb.width]
  )

  const onThumbPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current
      if (!state || state.pointerId !== e.pointerId) return
      const scroll = scrollRef.current
      if (!scroll) return
      const delta = e.clientX - state.startClientX
      const nextScroll =
        state.startScrollLeft + (delta / state.trackInner) * state.scrollRange
      scroll.scrollLeft = Math.max(
        0,
        Math.min(state.scrollRange, nextScroll)
      )
    },
    []
  )

  const releaseDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current
    if (!state || state.pointerId !== e.pointerId) return
    dragStateRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }, [])

  return (
    <div className={className}>
      <div className="site-container">
        <div ref={scrollRef} className={`${accountSubNavRowClass} py-4`}>
          {children}
        </div>
      </div>
      <div ref={trackRef} className="relative h-4 w-full">
        {pointerLeft !== null ? (
          <div
            className="pointer-events-none absolute top-0 h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-neutral-900 transition-[left] duration-250 ease-out"
            style={{ left: pointerLeft }}
            aria-hidden="true"
          />
        ) : null}
        <div className="absolute inset-x-0 top-[10px] h-[2px] rounded-full bg-neutral-200" aria-hidden="true" />
        {thumb.visible ? (
          <div
            role="slider"
            aria-label="Desplazar menú"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(
              (thumb.left / Math.max(1, (trackRef.current?.clientWidth ?? 0) - thumb.width)) * 100
            )}
            tabIndex={-1}
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={releaseDrag}
            onPointerCancel={releaseDrag}
            className="absolute top-[9px] h-1 cursor-grab touch-none rounded-full bg-neutral-900 transition-colors hover:bg-black active:cursor-grabbing"
            style={{ left: thumb.left, width: thumb.width }}
          />
        ) : null}
      </div>
    </div>
  )
}
