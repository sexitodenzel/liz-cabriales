"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

type Props = {
  /** Hay selección en el resumen → la barra puede mostrarse. */
  hasSelection: boolean
  totalPrice: number
  formatPrice: (v: number) => string
  serviceLabel: string
  onContinue: () => void
  canContinue: boolean
  submitting?: boolean
  /** Pasos 1–3: Continuar. Paso 4: Confirmar reserva. */
  isConfirmStep?: boolean
}

/**
 * Barra sticky inferior (móvil): Continuar / Confirmar del resumen.
 * Aparece con selección y se oculta al entrar al footer
 * (misma receta que el sticky de Reservar en /servicios).
 */
export default function StickyContinueBar({
  hasSelection,
  totalPrice,
  formatPrice,
  serviceLabel,
  onContinue,
  canContinue,
  submitting = false,
  isConfirmStep = false,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf: number | null = null
    const check = () => {
      raf = null
      if (!hasSelection) {
        setVisible(false)
        return
      }
      // Desktop: el aside sticky del resumen ya trae el CTA.
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setVisible(false)
        return
      }
      const footer =
        document.getElementById("footer-reveal-sentinel") ??
        document.querySelector("footer")
      const beforeFooter = footer
        ? footer.getBoundingClientRect().top > window.innerHeight - 12
        : true
      setVisible(beforeFooter)
    }
    const onScroll = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(check)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    check()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [hasSelection])

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      role="region"
      aria-label="Continuar reserva"
    >
      <div className="site-container">
        <div className="flex items-center gap-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden">
              <Image
                src="/images/logo.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
                {serviceLabel}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#0a0a0a]">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || submitting}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isConfirmStep
              ? submitting
                ? "Procesando…"
                : "Confirmar"
              : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  )
}
