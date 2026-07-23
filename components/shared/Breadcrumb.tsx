import Link from "next/link"

import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  href?: string
}

function ChevLeftIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-70"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export default function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  return (
    <nav
      aria-label="Ruta de navegación"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#8a8a8a]",
        className ?? "mb-2",
      )}
    >
      {items.map((item, index) => {
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-x-2">
            {index > 0 && (
              <span aria-hidden className="text-[#cfcfcf]">
                /
              </span>
            )}

            {isLast ? (
              <span aria-current="page" className="text-[#4a4a4a]">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 transition-colors hover:text-[#C6A75E]"
              >
                {isFirst && <ChevLeftIcon />}
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
