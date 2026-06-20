import Link from "next/link"

export type BreadcrumbItem = {
  label: string
  href?: string
}

function ChevLeftIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#6b6b6b]">
      {items.map((item, index) => {
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-[#bdbdbd]">/</span>}

            {isLast ? (
              <span className="text-[#C6A75E]">{item.label}</span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-2 transition-colors hover:text-[#C6A75E]"
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
