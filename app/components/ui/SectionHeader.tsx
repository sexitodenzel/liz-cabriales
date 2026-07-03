import Link from "next/link"
import type { ReactNode } from "react"

import { ArrowRightIcon } from "./icons"

/* Encabezado único de sección para la landing y páginas públicas.
   El resaltado dorado del título se marca con <em> dentro de `title`:
     title={<>Nuevos <em>Lanzamientos</em></>} */

type SectionHeaderProps = {
  title: ReactNode
  eyebrow?: string
  description?: string
  cta?: { href: string; label: string }
  align?: "left" | "center"
  tone?: "light" | "dark"
  /** id del <h2>, para aria-labelledby en la sección. */
  id?: string
  className?: string
}

export default function SectionHeader({
  title,
  eyebrow,
  description,
  cta,
  align = "left",
  tone = "light",
  id,
  className = "",
}: SectionHeaderProps) {
  const dark = tone === "dark"
  const centered = align === "center"

  return (
    <header
      className={`mb-10 md:mb-12 ${
        centered ? "text-center" : "sm:flex sm:items-end sm:justify-between sm:gap-6"
      } ${className}`}
    >
      <div className={centered ? "mx-auto max-w-[720px]" : "max-w-[720px]"}>
        {eyebrow && (
          <p
            className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${
              dark ? "text-gold-soft" : "text-gold"
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          id={id}
          className={`font-display text-[clamp(32px,4.2vw,52px)] font-medium leading-[1.05] tracking-[-0.01em] [&_em]:font-medium [&_em]:italic ${
            dark
              ? "text-white [&_em]:text-gold-soft"
              : "text-ink [&_em]:text-gold"
          }`}
        >
          {title}
        </h2>
        <div
          className={`mt-5 h-0.5 w-16 bg-gold-soft ${centered ? "mx-auto" : ""}`}
          aria-hidden
        />
        {description && (
          <p
            className={`mt-4 max-w-[520px] text-[15px] font-normal leading-[1.6] ${
              dark ? "text-white/60" : "text-ink-soft"
            } ${centered ? "mx-auto" : ""}`}
          >
            {description}
          </p>
        )}
        {centered && cta && <SectionCta cta={cta} dark={dark} className="mt-6" />}
      </div>
      {!centered && cta && (
        <SectionCta cta={cta} dark={dark} className="mt-5 shrink-0 sm:mb-1 sm:mt-0" />
      )}
    </header>
  )
}

function SectionCta({
  cta,
  dark,
  className = "",
}: {
  cta: { href: string; label: string }
  dark: boolean
  className?: string
}) {
  return (
    <Link
      href={cta.href}
      className={`group inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
        dark ? "text-gold-soft hover:text-white" : "text-gold hover:text-ink"
      } ${className}`}
    >
      {cta.label}
      <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
        <ArrowRightIcon />
      </span>
    </Link>
  )
}
