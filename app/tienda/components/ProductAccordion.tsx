"use client"

import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { EASE_OUT } from "@/lib/ease"
import OrderInfo, { type OrderInfoProps } from "./orderInfo"

type SectionId = "descripcion" | "aplicacion" | "pedido"

type Props = {
  description: string | null
  longDescription: string | null
  applicationText: string | null
  sizeLabels: string[]
  order: OrderInfoProps
}

const SECTIONS: Array<{ id: SectionId; title: string }> = [
  { id: "descripcion", title: "Descripción" },
  { id: "aplicacion", title: "Aplicación / Tamaño" },
  { id: "pedido", title: "Pedido en línea" },
]

function formatParagraphs(text: string | null): ReactNode {
  if (!text) return null
  return text
    .split(/\n{2,}/)
    .map((block, i) => (
      <p key={i} className="mt-3 first:mt-0 leading-7 text-neutral-700">
        {block.split("\n").map((line, j, arr) => (
          <span key={j}>
            {line}
            {j < arr.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    ))
}

export default function ProductAccordion({
  description,
  longDescription,
  applicationText,
  sizeLabels,
  order,
}: Props) {
  const [open, setOpen] = useState<Set<SectionId>>(new Set())

  const toggle = useCallback((id: SectionId) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      if (detail !== "descripcion" && detail !== "aplicacion" && detail !== "pedido") {
        return
      }
      setOpen((prev) => {
        if (prev.has(detail as SectionId)) return prev
        const next = new Set(prev)
        next.add(detail as SectionId)
        return next
      })
      // Scroll después de que el panel haya empezado a expandirse
      window.requestAnimationFrame(() => {
        const el = document.getElementById(`producto-acordeon-${detail}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      })
    }
    window.addEventListener("lc:product-accordion-open", handler)
    return () => window.removeEventListener("lc:product-accordion-open", handler)
  }, [])

  return (
    <section id="producto-acordeon" className="mt-20">
      <h2 className="text-center text-lg font-semibold uppercase tracking-[0.24em] text-[#0a0a0a]">
        Informaciones de producto
      </h2>
      <div className="mt-10 border-t border-neutral-200">
        {SECTIONS.map((section) => {
          const isOpen = open.has(section.id)
          return (
            <div
              key={section.id}
              id={`producto-acordeon-${section.id}`}
              className="border-b border-neutral-200"
            >
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0a0a0a]">
                  {section.title}
                </span>
                <motion.span
                  initial={false}
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="text-neutral-500"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8 pr-2 text-sm">
                      {section.id === "descripcion" && (
                        <SectionDescripcion
                          description={description}
                          longDescription={longDescription}
                        />
                      )}
                      {section.id === "aplicacion" && (
                        <SectionAplicacion
                          applicationText={applicationText}
                          sizeLabels={sizeLabels}
                        />
                      )}
                      {section.id === "pedido" && <OrderInfo {...order} />}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SectionDescripcion({
  longDescription,
}: {
  description: string | null
  longDescription: string | null
}) {
  const content = longDescription?.trim() ?? null
  if (!content) {
    return (
      <p className="text-neutral-500">
        Pronto agregaremos la descripción completa de este producto.
      </p>
    )
  }
  return <div className="text-neutral-700">{formatParagraphs(content)}</div>
}

function SectionAplicacion({
  applicationText,
  sizeLabels,
}: {
  applicationText: string | null
  sizeLabels: string[]
}) {
  const hasText = Boolean(applicationText?.trim())
  const hasSizes = sizeLabels.length > 0
  if (!hasText && !hasSizes) {
    return (
      <p className="text-neutral-500">
        Pronto agregaremos las indicaciones de aplicación y los tamaños disponibles.
      </p>
    )
  }
  return (
    <div className="space-y-6 text-neutral-700">
      {hasText ? (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
            Cómo aplicar
          </h4>
          <div className="mt-3">{formatParagraphs(applicationText)}</div>
        </div>
      ) : null}
      {hasSizes ? (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
            Tamaño
          </h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sizeLabels.map((s) => (
              <li
                key={s}
                className="inline-flex h-8 items-center rounded-full border border-neutral-300 px-3 text-xs text-neutral-700"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
