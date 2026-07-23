import { Fragment, type ReactNode } from "react"

/**
 * Renderiza texto con formato ligero (tipo Markdown) como HTML bonito, sin
 * dependencias externas ni dangerouslySetInnerHTML (seguro contra XSS).
 *
 * Convenciones que puede escribir Liz desde el panel:
 *   ## Título de sección        → subtítulo (ej. "🎓 ¿Qué vas a aprender?")
 *   - Punto  /  • Punto         → viñeta
 *   **texto**                   → negrita
 *   línea en blanco             → separa párrafos
 *
 * Texto plano sin marcas se muestra como párrafos normales (compatibilidad).
 */

// Convierte **negritas** en nodos React.
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#1a1a1a]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

type Block =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string }

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "list", items: list })
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }
    const heading = line.match(/^#{1,3}\s+(.*)$/)
    const bullet = line.match(/^[-•*]\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ type: "heading", text: heading[1] })
    } else if (bullet) {
      flushParagraph()
      list.push(bullet[1])
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

export default function RichText({
  text,
  className = "",
  serifHeadings = false,
}: {
  text: string
  className?: string
  /** Subtítulos en Playfair. Solo para contextos editoriales (blog);
      el default sans sigue la escala de docs/design-system.md §Tipografía. */
  serifHeadings?: boolean
}) {
  const blocks = parseBlocks(text)
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3
              key={i}
              className={
                serifHeadings
                  ? "mb-2 mt-7 font-display text-[19px] font-medium text-[#1a1a1a] first:mt-0"
                  : "mb-2 mt-7 text-[16px] font-semibold text-[#1a1a1a] first:mt-0"
              }
            >
              {renderInline(block.text)}
            </h3>
          )
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="mb-4 space-y-2 last:mb-0">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className="flex gap-2.5 text-[15px] leading-[1.6] text-[#3a3a3a]"
                >
                  <span className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c6a75e]" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p
            key={i}
            className="mb-4 text-[15px] leading-[1.7] text-[#3a3a3a] last:mb-0"
          >
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}
