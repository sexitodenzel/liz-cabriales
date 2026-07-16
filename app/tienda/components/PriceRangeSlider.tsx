"use client"

import { useEffect, useState } from "react"

type PriceRangeSliderProps = {
  bounds: { min: number; max: number }
  valueMin: number | null
  valueMax: number | null
  trackClass?: string
  onChange: (min: number | null, max: number | null) => void
}

export default function PriceRangeSlider({
  bounds,
  valueMin,
  valueMax,
  trackClass = "bg-neutral-200",
  onChange,
}: PriceRangeSliderProps) {
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null)

  const span = Math.max(bounds.max - bounds.min, 1)

  const rawMin = Math.min(
    Math.max(valueMin ?? bounds.min, bounds.min),
    bounds.max
  )
  const rawMax = Math.max(
    Math.min(valueMax ?? bounds.max, bounds.max),
    bounds.min
  )
  const effMin = Math.min(rawMin, rawMax)
  const effMax = Math.max(rawMin, rawMax)

  const leftPct = ((effMin - bounds.min) / span) * 100
  const rightPct = ((effMax - bounds.min) / span) * 100

  const midpoint = bounds.min + span / 2
  const minOnTop =
    activeThumb === "min" ||
    (activeThumb !== "max" && effMin > midpoint)

  const handleMin = (raw: number) => {
    const clamped = Math.min(raw, effMax)
    onChange(clamped <= bounds.min ? null : clamped, valueMax)
  }

  const handleMax = (raw: number) => {
    const clamped = Math.max(raw, effMin)
    onChange(valueMin, clamped >= bounds.max ? null : clamped)
  }

  useEffect(() => {
    if (!activeThumb) return

    const clearActiveThumb = () => setActiveThumb(null)
    window.addEventListener("pointerup", clearActiveThumb)
    window.addEventListener("pointercancel", clearActiveThumb)
    return () => {
      window.removeEventListener("pointerup", clearActiveThumb)
      window.removeEventListener("pointercancel", clearActiveThumb)
    }
  }, [activeThumb])

  return (
    <div className="px-1 py-2">
      <div className="price-range h-6">
        <div
          className={`absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full ${trackClass}`}
        />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#c6a75e]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={1}
          value={effMin}
          onPointerDown={() => setActiveThumb("min")}
          onChange={(event) => handleMin(Number(event.target.value))}
          aria-label="Precio mínimo"
          className="price-range-input"
          style={{ zIndex: minOnTop ? 5 : 3 }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={1}
          value={effMax}
          onPointerDown={() => setActiveThumb("max")}
          onChange={(event) => handleMax(Number(event.target.value))}
          aria-label="Precio máximo"
          className="price-range-input"
          style={{ zIndex: minOnTop ? 4 : 5 }}
        />
      </div>
    </div>
  )
}
