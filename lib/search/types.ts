import type { SearchDoc, SearchDocType } from "./engine"

/** Documento tal como viaja al cliente (sin los campos internos de ranking). */
export type SearchItem = Omit<SearchDoc, "keywords" | "body" | "boost">

export type SearchPayload = {
  query: string
  products: SearchItem[]
  courses: SearchItem[]
  services: SearchItem[]
  categories: SearchItem[]
  brands: SearchItem[]
  pages: SearchItem[]
  total: number
}

export function isEmptyPayload(payload: SearchPayload | null): boolean {
  if (!payload) return true
  return (
    payload.products.length === 0 &&
    payload.courses.length === 0 &&
    payload.services.length === 0 &&
    payload.categories.length === 0 &&
    payload.brands.length === 0 &&
    payload.pages.length === 0
  )
}

/**
 * Orden canónico de las sugerencias. La UI DEBE pintar las secciones en este
 * mismo orden: es el que recorren las flechas del teclado.
 */
export function flattenPayload(payload: SearchPayload | null): SearchItem[] {
  if (!payload) return []
  return [
    ...payload.categories,
    ...payload.brands,
    ...payload.pages,
    ...payload.services,
    ...payload.courses,
    ...payload.products,
  ]
}

export const SEARCH_TYPE_LABEL: Record<SearchDocType, string> = {
  product: "Producto",
  course: "Curso",
  service: "Servicio",
  category: "Categoría",
  brand: "Marca",
  page: "Sección",
}
