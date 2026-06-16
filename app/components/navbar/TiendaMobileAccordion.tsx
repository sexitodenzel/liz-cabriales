import Link from "next/link"
import { ChevronDown } from "lucide-react"
import type { TiendaCategory } from "./menuData"

type Props = {
  openCategory: string | null
  setOpenCategory: (slug: string | null) => void
  onClose: () => void
  categories: TiendaCategory[]
  sectionHref: string
  sectionLabel: string
}

export default function TiendaMobileAccordion({
  openCategory,
  setOpenCategory,
  onClose,
  categories,
  sectionHref,
  sectionLabel,
}: Props) {
  return (
    <div>
      <Link
        href={sectionHref}
        onClick={onClose}
        className="block pb-3 text-[12px] font-semibold tracking-[0.05em] text-[#C6A75E]"
      >
        Ver {sectionLabel} →
      </Link>
      {categories.map((cat) => {
        const isCatOpen = openCategory === cat.slug
        return (
          <div key={cat.slug} className="border-b border-white/5 last:border-0">
            <button
              type="button"
              onClick={() => setOpenCategory(isCatOpen ? null : cat.slug)}
              className={`flex w-full items-center justify-between py-2.5 text-[14px] transition-colors ${
                isCatOpen ? "text-[#C6A75E]" : "text-neutral-300"
              }`}
            >
              <span>{cat.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                  isCatOpen ? "rotate-180 text-[#C6A75E]" : "text-neutral-500"
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
                isCatOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden min-h-0">
                <div className="pb-2 pl-3">
                  <Link
                    href={cat.href}
                    onClick={onClose}
                    className="block py-1.5 text-[12px] font-medium text-[#C6A75E]/70 hover:text-[#C6A75E] transition-colors"
                  >
                    Ver todo en {cat.label}
                  </Link>
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      onClick={onClose}
                      className="block py-1.5 text-[13px] text-neutral-400 transition-colors hover:text-[#C6A75E]"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
