"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { EASE_OUT } from "@/lib/ease"
import type { ServiceWithOptions } from "@/lib/supabase/appointments"

type Props = {
  service: ServiceWithOptions | null
  open: boolean
  onClose: () => void
  selected: boolean
  onToggle: () => void
  formatPrice: (v: number) => string
  formatDuration: (min: number) => string
}

export default function ServiceDetailSheet({
  service,
  open,
  onClose,
  selected,
  onToggle,
  formatPrice,
  formatDuration,
}: Props) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && service && (
        <div className="fixed inset-0 z-[72]">
          {/* Mismo blur/overlay que el megamenú del navbar. */}
          <motion.button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="absolute inset-0 h-full w-full cursor-default bg-black/10 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={service.name}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="absolute inset-x-0 bottom-0 flex h-[92dvh] max-h-[92dvh] flex-col rounded-t-[1.75rem] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-6">
              {/* Misma tipografía que el título del paso (StepHeading). */}
              <h2 className="min-w-0 flex-1 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-[#0a0a0a]">
                {service.name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#111] transition-colors hover:bg-neutral-100"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              {/* Misma tipografía que el subtítulo del paso. */}
              {service.description?.trim() ? (
                <p className="max-w-xl text-[15px] leading-relaxed text-neutral-500">
                  {service.description.trim()}
                </p>
              ) : (
                <p className="text-[15px] leading-relaxed text-neutral-400">
                  Sin descripción.
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-neutral-200/80 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold text-[#0a0a0a]">
                    {formatPrice(service.price)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-neutral-500">
                    {formatDuration(service.duration_min)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onToggle()
                    onClose()
                  }}
                  className={`inline-flex h-10 shrink-0 items-center justify-center rounded-full px-6 text-[13px] font-medium transition-colors ${
                    selected
                      ? "border border-neutral-300 bg-white text-[#111] hover:border-neutral-900"
                      : "bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                >
                  {selected ? "Quitar" : "Añadir"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
