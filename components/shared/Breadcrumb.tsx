import Link from "next/link"

export type BreadcrumbItem = {
  label: string
  href?: string
}

function ChevLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
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
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-[#6b6b6b]">
      {items.map((item, index) => {
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-[#9a9a9a]">/</span>}

            {isLast ? (
              <span className="font-medium text-[#1a1a1a]">{item.label}</span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-2 transition-colors hover:text-[#a8893a]"
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
