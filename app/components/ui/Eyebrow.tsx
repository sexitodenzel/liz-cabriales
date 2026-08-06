import type { ReactNode } from "react"

/* Sobre-título editorial (el textito en mayúsculas espaciadas sobre los
   títulos, estilo /academia). Una sola receta para todo el sitio: dorado,
   uppercase, tracking amplio. No inventar trackings nuevos por página. */

type EyebrowProps = {
  children: ReactNode
  className?: string
}

export default function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-soft ${className}`}
    >
      {children}
    </p>
  )
}
