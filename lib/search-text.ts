export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function tokenizeSearchQuery(input: string): string[] {
  return normalizeSearchText(input)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

export function scoreSearchMatch(
  name: string,
  tokens: string[],
  slug?: string
): number {
  const normalizedName = normalizeSearchText(name)
  const normalizedSlug = slug ? normalizeSearchText(slug) : ""

  const scoreField = (value: string) =>
    tokens.reduce((score, token) => {
      if (!value) return score
      if (value === token) return score + 6
      if (value.startsWith(token)) return score + 4
      if (value.includes(token)) return score + 2
      return score
    }, 0)

  return Math.max(scoreField(normalizedName), scoreField(normalizedSlug))
}

export function buildSupabaseOrFilter(
  tokens: string[],
  fields: string[]
): string {
  const clauses = new Set<string>()

  for (const token of tokens) {
    for (const field of fields) {
      clauses.add(`${field}.ilike.%${token}%`)
      if (token.length >= 3) {
        clauses.add(`${field}.ilike.%${token.slice(0, 3)}%`)
      }
    }
  }

  return Array.from(clauses).join(",")
}
