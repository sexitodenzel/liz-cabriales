"use client"

import { useEffect, useRef, useState } from "react"

const STATS = [
  { target: 7, suffix: "+", label: "Años de trayectoria" },
  { target: 15, suffix: "+", label: "Marcas profesionales" },
  { target: 20, suffix: "+", label: "Masters nacionales" },
  { target: 500, from: 460, suffix: "+", label: "Alumnas formadas" },
] as const

/** Rápido al inicio, cada vez más lento al acercarse al número final. */
function easeOutQuint(progress: number): number {
  return 1 - Math.pow(1 - progress, 5)
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, inView }
}

function AnimatedStat({
  target,
  from = 1,
  suffix,
  label,
  start,
  delay = 0,
}: {
  target: number
  from?: number
  suffix: string
  label: string
  start: boolean
  delay?: number
}) {
  const [value, setValue] = useState(from)
  const hasFinishedRef = useRef(false)

  useEffect(() => {
    if (!start || hasFinishedRef.current) return

    let raf = 0
    let timeout: ReturnType<typeof setTimeout> | undefined
    const range = target - from
    const duration = 5200 + range * 120

    const run = () => {
      const startTime = performance.now()

      const tick = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutQuint(progress)
        const next = Math.round(from + range * eased)

        setValue(next)

        if (progress < 1) {
          raf = requestAnimationFrame(tick)
        } else {
          setValue(target)
          hasFinishedRef.current = true
        }
      }

      raf = requestAnimationFrame(tick)
    }

    timeout = setTimeout(run, delay)

    return () => {
      if (timeout) clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [start, target, from, delay])

  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-display text-[clamp(38px,4.6vw,60px)] font-medium leading-none tabular-nums text-gold">
        {value}
        {suffix}
      </span>
      <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
        {label}
      </span>
    </div>
  )
}

export default function SobreLizStats() {
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="site-container mt-20" aria-label="Estadísticas">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-y border-[#c6a75e]/30 py-12 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <AnimatedStat
            key={stat.label}
            target={stat.target}
            from={"from" in stat ? stat.from : 1}
            suffix={stat.suffix}
            label={stat.label}
            start={inView}
            delay={index * 150}
          />
        ))}
      </div>
    </section>
  )
}
