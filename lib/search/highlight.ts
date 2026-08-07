/**
 * Resaltado del texto que coincide con lo escrito (isomorfo).
 *
 * Trabaja sobre una copia plegada carácter a carácter para que los índices
 * calzen 1:1 con el texto original y el resaltado no se corra con acentos.
 */

import { foldText, prepareQuery } from "./text"

export type HighlightSegment = { text: string; match: boolean }

function foldPreservingLength(chars: string[]): string[] {
  return chars.map((char) => {
    const folded = foldText(char)
    return folded.length === 1 ? folded : char.toLowerCase()
  })
}

/**
 * Divide `text` en segmentos marcando los tramos que coinciden con algún token
 * de la consulta (match por prefijo de palabra, como cualquier autocompletado).
 */
export function highlightSegments(
  text: string,
  query: string
): HighlightSegment[] {
  const chars = Array.from(text)
  const terms = prepareQuery(query).tokens.map((token) => token.raw)
  if (chars.length === 0 || terms.length === 0) {
    return [{ text, match: false }]
  }

  const folded = foldPreservingLength(chars).join("")
  const marked = new Array<boolean>(chars.length).fill(false)

  for (const term of terms) {
    if (term.length === 0) continue
    let from = 0
    for (;;) {
      const at = folded.indexOf(term, from)
      if (at === -1) break
      const isWordStart = at === 0 || !/[a-z0-9]/.test(folded[at - 1] ?? "")
      if (isWordStart) {
        for (let i = at; i < at + term.length; i++) marked[i] = true
      }
      from = at + 1
    }
  }

  const segments: HighlightSegment[] = []
  let buffer = ""
  let current = marked[0] ?? false

  for (let i = 0; i < chars.length; i++) {
    if (marked[i] === current) {
      buffer += chars[i]
      continue
    }
    if (buffer) segments.push({ text: buffer, match: current })
    buffer = chars[i]
    current = marked[i]
  }
  if (buffer) segments.push({ text: buffer, match: current })

  return segments
}
