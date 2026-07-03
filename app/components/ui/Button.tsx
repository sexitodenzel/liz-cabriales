import Link from "next/link"
import type { ReactNode } from "react"

import { ArrowRightIcon } from "./icons"

/* Botón único del sitio público. Tres variantes y nada más:
   - primary: pill tinta → hover dorado
   - outline: pill contorno dorado → hover relleno suave
   - link:    CTA editorial en uppercase con flecha */

type ButtonVariant = "primary" | "outline" | "link"

type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  href?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  withArrow?: boolean
  className?: string
  "aria-label"?: string
}

const BASE =
  "group inline-flex cursor-pointer items-center justify-center gap-2 font-semibold uppercase transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40"

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-ink px-7 py-3 text-[12px] tracking-[0.16em] text-white hover:bg-gold",
  outline:
    "rounded-full border border-gold-soft/60 px-7 py-3 text-[12px] tracking-[0.16em] text-gold hover:bg-gold-soft/10",
  link: "gap-2.5 text-[11px] tracking-[0.2em] text-gold hover:text-ink",
}

export default function Button({
  children,
  variant = "primary",
  href,
  onClick,
  type = "button",
  disabled,
  withArrow = variant === "link",
  className = "",
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`

  const content = (
    <>
      {children}
      {withArrow && (
        <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
          <ArrowRightIcon
            className={variant === "link" ? "h-3 w-[18px]" : "h-2.5 w-[15px]"}
          />
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  )
}
