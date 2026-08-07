/**
 * Destino del Enter en el buscador: la página de resultados unificada, que
 * incluye productos, cursos, servicios, categorías y marcas. Antes se iba
 * directo a /tienda y una búsqueda de servicio o curso terminaba en una
 * cuadrícula vacía.
 */
export function getSearchDestination(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return "/tienda"
  return `/buscar?q=${encodeURIComponent(trimmed)}`
}

/** Resultados acotados solo a productos (chips de la tienda, filtros). */
export function getStoreSearchDestination(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return "/tienda"
  return `/tienda?search=${encodeURIComponent(trimmed)}`
}
