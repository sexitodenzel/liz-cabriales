/* Iconos de línea compartidos del sistema de diseño.
   Trazo fino y remates rectos — mismo lenguaje en flechas y chevrons. */

export function ArrowRightIcon({
  className = "h-3 w-[18px]",
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 18 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden
      className={className}
    >
      <path d="M0 6 H18 M13 1 L18 6 L13 11" />
    </svg>
  )
}

export function ChevronLeftIcon({
  className = "h-[18px] w-[18px]",
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <polyline points="15 6 9 12 15 18" />
    </svg>
  )
}

export function ChevronRightIcon({
  className = "h-[18px] w-[18px]",
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}
