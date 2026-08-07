/**
 * Normalización de texto para búsqueda (isomorfo: server y cliente).
 *
 * Modelo estándar de buscadores de tienda (Algolia/Elastic simplificado):
 *   texto → plegado (minúsculas + sin acentos) → tokens → stopwords →
 *   variantes singular/plural → sinónimos del rubro.
 *
 * Regla clave: el índice y la consulta pasan SIEMPRE por las mismas funciones.
 * Si sólo se normaliza la consulta (bug histórico de este repo), "acrilico"
 * nunca encuentra "Acrílico".
 */

/** Minúsculas + sin acentos + ñ→n. Base de todas las comparaciones. */
export function foldText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/** Plegado + separación por cualquier cosa que no sea letra/número. */
export function tokenize(input: string): string[] {
  return foldText(input)
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 0)
}

/**
 * Palabras vacías del español que no aportan intención de búsqueda.
 * OJO: "una/unas" NO están aquí a propósito — "uñas" pliega a "unas" y es la
 * palabra más buscada del sitio.
 */
const STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "o",
  "u",
  "en",
  "al",
  "a",
  "con",
  "sin",
  "por",
  "para",
  "que",
  "es",
  "son",
  "mi",
  "mis",
  "tu",
  "tus",
  "su",
  "sus",
  "lo",
  "se",
  "me",
  "te",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "esa",
  "todo",
  "toda",
  "todos",
  "todas",
  "muy",
  "mas",
])

/**
 * Variantes singular/plural de un token. Se generan a ambos lados (índice y
 * consulta) y el match ocurre si CUALQUIER variante coincide; así "geles"↔"gel"
 * y "esmaltes"↔"esmalte" funcionan sin necesidad de un stemmer completo.
 */
export function tokenVariants(token: string): string[] {
  const variants = [token]
  if (token.length > 4 && token.endsWith("es")) {
    variants.push(token.slice(0, -1)) // esmaltes → esmalte
    variants.push(token.slice(0, -2)) // geles → gel
  } else if (token.length > 3 && token.endsWith("s")) {
    variants.push(token.slice(0, -1)) // limas → lima
  } else if (token.length > 3) {
    variants.push(`${token}s`) // lima → limas (consulta singular, índice plural)
  }
  return variants
}

/**
 * Sinónimos del rubro (uñas / academia / estudio). Cada grupo es bidireccional:
 * cualquier término del grupo encuentra a los demás, con score reducido frente
 * a un match literal.
 *
 * Se mantiene corto a propósito: sinónimos de más ensucian la precisión. Para
 * casos puntuales de un producto existe `products.search_synonyms` (editable
 * desde el panel), que pesa como marca en el ranking.
 */
const SYNONYM_GROUPS: string[][] = [
  ["esmalte", "barniz", "pintaunas", "polish", "laca"],
  ["gel", "gelish", "semipermanente", "permanente"],
  ["acrilico", "acrylic", "polimero", "polvo"],
  ["monomero", "liquido", "acrilico"],
  ["lima", "pulidor", "buffer", "taco"],
  ["torno", "router", "drill", "fresa", "broca"],
  ["cabina", "lampara", "uv", "led"],
  ["pincel", "brocha", "kolinsky"],
  ["cuticula", "empujador", "pusher", "removedor"],
  ["acetona", "quitaesmalte", "removedor", "retiro"],
  ["tip", "tips", "molde", "moldes", "extension", "capping"],
  ["adhesivo", "pegamento", "resina"],
  ["decoracion", "glitter", "escarcha", "brillo", "piedra", "cristal"],
  ["base", "primer", "bonder", "deshidratador"],
  ["top", "topcoat", "sellador", "brillo"],
  ["curso", "capacitacion", "taller", "clase", "diplomado", "masterclass", "academia", "certificacion", "aprender"],
  ["servicio", "cita", "agendar", "reservar", "estudio"],
  ["manicura", "manicure", "mani", "manos"],
  ["pedicura", "pedicure", "pedi", "pies"],
  ["una", "nail", "nails"],
  ["oferta", "descuento", "promocion", "rebaja", "sale"],
  ["marca", "brand"],
]

const SYNONYMS = (() => {
  const map = new Map<string, Set<string>>()
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      const bucket = map.get(term) ?? new Set<string>()
      for (const other of group) {
        if (other !== term) bucket.add(other)
      }
      map.set(term, bucket)
    }
  }
  return map
})()

export type QueryToken = {
  /** Token tal cual lo escribió la clienta (plegado). */
  raw: string
  /** Variantes singular/plural del token. */
  variants: string[]
  /** Sinónimos (con sus variantes), ya sin duplicados del token original. */
  synonyms: string[]
  /** Último token de la consulta: se trata como prefijo (se está escribiendo). */
  isLast: boolean
}

export type PreparedQuery = {
  /** Consulta original recortada. */
  raw: string
  /** Consulta plegada y con espacios colapsados (para match de frase). */
  phrase: string
  tokens: QueryToken[]
}

/** Analiza la consulta una sola vez por request/keystroke. */
export function prepareQuery(input: string): PreparedQuery {
  const raw = input.trim()
  const phrase = foldText(raw).replace(/\s+/g, " ").trim()
  const all = tokenize(raw)

  // Sin stopwords, salvo que la consulta entera sean stopwords.
  const meaningful = all.filter((t) => !STOPWORDS.has(t))
  const base = meaningful.length > 0 ? meaningful : all

  // Límite defensivo: consultas absurdamente largas no deben costar CPU.
  const limited = base.slice(0, 8)

  const tokens: QueryToken[] = limited.map((token, index) => {
    const variants = tokenVariants(token)
    const synonymSet = new Set<string>()
    for (const variant of variants) {
      for (const synonym of SYNONYMS.get(variant) ?? []) {
        for (const synonymVariant of tokenVariants(synonym)) {
          synonymSet.add(synonymVariant)
        }
      }
    }
    for (const variant of variants) synonymSet.delete(variant)
    return {
      raw: token,
      variants,
      synonyms: Array.from(synonymSet),
      isLast: index === limited.length - 1,
    }
  })

  return { raw, phrase, tokens }
}

/**
 * Distancia de edición (Damerau-Levenshtein) acotada: devuelve -1 en cuanto
 * supera `max`. Acotarla es lo que hace viable el fuzzy en cada tecleo.
 */
export function boundedEditDistance(a: string, b: string, max: number): number {
  if (a === b) return 0
  const lenA = a.length
  const lenB = b.length
  if (Math.abs(lenA - lenB) > max) return -1

  let prev2: number[] = []
  let prev: number[] = new Array(lenB + 1)
  let current: number[] = new Array(lenB + 1)

  for (let j = 0; j <= lenB; j++) prev[j] = j

  for (let i = 1; i <= lenA; i++) {
    current[0] = i
    const from = Math.max(1, i - max)
    const to = Math.min(lenB, i + max)
    // Fuera de la banda diagonal la distancia ya excede max.
    if (from > 1) current[from - 1] = max + 1
    let rowMin = max + 1

    for (let j = from; j <= to; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(
        prev[j] + 1, // borrado
        current[j - 1] + 1, // inserción
        prev[j - 1] + cost // sustitución
      )
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1] &&
        prev2.length > 0
      ) {
        value = Math.min(value, prev2[j - 2] + 1) // transposición
      }
      current[j] = value
      if (value < rowMin) rowMin = value
    }
    if (to < lenB) current[to + 1] = max + 1
    if (rowMin > max) return -1

    prev2 = prev
    prev = current
    current = new Array(lenB + 1)
  }

  const distance = prev[lenB]
  return distance <= max ? distance : -1
}

/**
 * Presupuesto de typos por longitud, igual que los buscadores comerciales:
 * palabras cortas exigen precisión, largas toleran más.
 */
export function typoBudget(token: string): number {
  if (token.length >= 8) return 2
  if (token.length >= 4) return 1
  return 0
}
