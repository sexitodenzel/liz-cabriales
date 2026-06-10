export function getSearchDestination(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return "/tienda"
  return `/tienda?search=${encodeURIComponent(trimmed)}`
}
