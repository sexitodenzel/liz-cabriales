/**
 * Motor de ranking (isomorfo: mismo código en el endpoint, en /buscar y en el
 * filtro de la tienda, para que el orden nunca se contradiga entre pantallas).
 *
 * Cada documento se indexa en tres campos con peso distinto — título, palabras
 * clave (marca/categoría/sinónimos/instructor) y cuerpo (descripción) — y cada
 * token de la consulta se puntúa con el mejor match disponible:
 * literal > variante singular/plural > prefijo > typo > subcadena, y los
 * sinónimos del rubro puntúan por debajo de todo lo anterior.
 */

import {
  boundedEditDistance,
  foldText,
  prepareQuery,
  tokenize,
  tokenVariants,
  typoBudget,
  type PreparedQuery,
  type QueryToken,
} from "./text"

export type SearchDocType =
  | "product"
  | "course"
  | "service"
  | "category"
  | "brand"
  | "page"

export type SearchDoc = {
  id: string
  type: SearchDocType
  title: string
  /** Línea secundaria (marca, categoría padre, instructor…). */
  subtitle: string | null
  href: string
  image: string | null
  price: number | null
  originalPrice: number | null
  discountPercent: number
  /** Dato corto para la fila: "12 sep · Tampico", "60 min", etc. */
  meta: string | null
  /** Campo medio: marca, categoría, sinónimos curados, nivel, ubicación… */
  keywords: string
  /** Campo débil: descripción. */
  body: string
  /** Multiplicador editorial (destacados, cursos próximos…). Base 1. */
  boost: number
}

export type SearchHit = {
  doc: SearchDoc
  score: number
  /** Tokens de la consulta que el documento realmente cubre. */
  coverage: number
}

type FieldIndex = {
  tokens: string[]
  variants: Set<string>
  text: string
}

export type PreparedDoc = {
  doc: SearchDoc
  title: FieldIndex
  keywords: FieldIndex
  body: FieldIndex
}

const FIELD_WEIGHT = { title: 10, keywords: 5, body: 1.6 } as const

const KIND_SCORE = {
  exact: 1,
  variant: 0.92,
  prefixLast: 0.8,
  prefixMid: 0.55,
  fuzzy1: 0.5,
  fuzzy2: 0.32,
  substring: 0.35,
} as const

/** Los sinónimos siempre valen menos que cualquier match directo. */
const SYNONYM_PENALTY = 0.6

/** El cuerpo se recorta: descripciones largas no deben costar CPU por tecleo. */
const BODY_TOKEN_LIMIT = 80

function buildField(text: string, tokenLimit?: number): FieldIndex {
  const folded = foldText(text).replace(/\s+/g, " ").trim()
  let tokens = tokenize(text)
  if (tokenLimit && tokens.length > tokenLimit) tokens = tokens.slice(0, tokenLimit)
  const variants = new Set<string>()
  for (const token of tokens) {
    for (const variant of tokenVariants(token)) variants.add(variant)
  }
  return { tokens, variants, text: folded }
}

function prepareDoc(doc: SearchDoc): PreparedDoc {
  return {
    doc,
    title: buildField(doc.title),
    keywords: buildField(doc.keywords),
    body: buildField(doc.body, BODY_TOKEN_LIMIT),
  }
}

export function prepareDocs(docs: SearchDoc[]): PreparedDoc[] {
  return docs.map(prepareDoc)
}

/**
 * Mejor calidad de match (0..1) de un término suelto dentro de un campo.
 * `allowFuzzy` se apaga en el cuerpo: ahí basta con literal/variante/subcadena.
 */
function matchTerm(
  field: FieldIndex,
  term: string,
  isLast: boolean,
  allowFuzzy: boolean
): number {
  if (field.tokens.length === 0 || term.length === 0) return 0

  if (field.tokens.includes(term)) return KIND_SCORE.exact

  for (const variant of tokenVariants(term)) {
    if (field.variants.has(variant)) return KIND_SCORE.variant
  }

  // El token que se está escribiendo vale como prefijo desde la primera letra;
  // los intermedios exigen dos para no arrastrar medio catálogo.
  if (term.length >= 2 || isLast) {
    for (const token of field.tokens) {
      if (token.length > term.length && token.startsWith(term)) {
        return isLast ? KIND_SCORE.prefixLast : KIND_SCORE.prefixMid
      }
    }
  }

  if (allowFuzzy) {
    const budget = typoBudget(term)
    if (budget > 0) {
      let best = 0
      for (const token of field.tokens) {
        if (Math.abs(token.length - term.length) > budget) continue
        // Primera letra distinta con presupuesto 1: casi siempre es otra
        // palabra ("lima" vs "cima"). Se exige coincidir en la inicial.
        if (budget === 1 && token[0] !== term[0]) continue
        const distance = boundedEditDistance(term, token, budget)
        if (distance === 1) best = Math.max(best, KIND_SCORE.fuzzy1)
        else if (distance === 2) best = Math.max(best, KIND_SCORE.fuzzy2)
        if (best === KIND_SCORE.fuzzy1) break
      }
      if (best > 0) return best
    }
  }

  if (term.length >= 4 && field.text.includes(term)) return KIND_SCORE.substring

  return 0
}

function scoreTokenInField(
  field: FieldIndex,
  token: QueryToken,
  allowFuzzy: boolean
): number {
  const direct = matchTerm(field, token.raw, token.isLast, allowFuzzy)
  if (direct >= KIND_SCORE.variant) return direct

  let best = direct
  for (const synonym of token.synonyms) {
    const value = matchTerm(field, synonym, false, false) * SYNONYM_PENALTY
    if (value > best) best = value
    if (best >= KIND_SCORE.exact * SYNONYM_PENALTY) break
  }
  return best
}

function scoreDoc(prepared: PreparedDoc, query: PreparedQuery): SearchHit | null {
  let total = 0
  let coverage = 0

  for (const token of query.tokens) {
    const title = scoreTokenInField(prepared.title, token, true)
    const keywords = scoreTokenInField(prepared.keywords, token, true)
    const body = scoreTokenInField(prepared.body, token, false)

    const best = Math.max(
      title * FIELD_WEIGHT.title,
      keywords * FIELD_WEIGHT.keywords,
      body * FIELD_WEIGHT.body
    )
    if (best <= 0) continue
    coverage += 1
    total += best
  }

  if (coverage === 0) return null

  // Bonos de frase: quien empieza igual que lo escrito va primero.
  if (query.phrase.length >= 3) {
    if (prepared.title.text === query.phrase) total += 22
    else if (prepared.title.text.startsWith(query.phrase)) total += 10
    else if (query.tokens.length > 1 && prepared.title.text.includes(query.phrase))
      total += 6
  }

  return { doc: prepared.doc, score: total * prepared.doc.boost, coverage }
}

/**
 * Ejecuta la consulta. Primero exige que el documento cubra TODOS los tokens
 * (semántica AND, la que espera cualquier comprador); si nadie los cubre,
 * degrada al mejor cubrimiento parcial en vez de devolver vacío.
 */
export function searchDocs(docs: PreparedDoc[], rawQuery: string): SearchHit[] {
  const query = prepareQuery(rawQuery)
  if (query.tokens.length === 0) return []

  const hits: SearchHit[] = []
  let maxCoverage = 0

  for (const prepared of docs) {
    const hit = scoreDoc(prepared, query)
    if (!hit) continue
    if (hit.coverage > maxCoverage) maxCoverage = hit.coverage
    hits.push(hit)
  }

  const required = Math.min(query.tokens.length, maxCoverage)
  const filtered = hits.filter((hit) => hit.coverage >= required)

  filtered.sort(
    (a, b) =>
      b.score - a.score ||
      a.doc.title.length - b.doc.title.length ||
      a.doc.title.localeCompare(b.doc.title, "es")
  )

  return filtered
}

export type GroupedHits = Record<SearchDocType, SearchDoc[]>

const EMPTY_GROUPS: () => GroupedHits = () => ({
  product: [],
  course: [],
  service: [],
  category: [],
  brand: [],
  page: [],
})

/** Reparte los hits ya ordenados en secciones, respetando un tope por tipo. */
export function groupHits(
  hits: SearchHit[],
  limits: Partial<Record<SearchDocType, number>>
): GroupedHits {
  const groups = EMPTY_GROUPS()
  for (const hit of hits) {
    const bucket = groups[hit.doc.type]
    const limit = limits[hit.doc.type] ?? 0
    if (bucket.length >= limit) continue
    bucket.push(hit.doc)
  }
  return groups
}
