"use client"

import { useEffect, useRef, useState } from "react"

import { foldText } from "@/lib/search/text"
import type { SearchPayload } from "@/lib/search/types"

/**
 * Autocompletado instantáneo.
 *
 * Tres cosas hacen que se sienta inmediato, y son las mismas que usa cualquier
 * tienda grande:
 *  1. caché en memoria por consulta → volver a una consulta ya escrita (o
 *     borrar letras) no dispara red y pinta en el mismo frame;
 *  2. una sola petición viva a la vez (AbortController + guardia de secuencia)
 *     → una respuesta lenta ya no puede pisar a una más nueva;
 *  3. los resultados anteriores se mantienen en pantalla mientras carga la
 *     siguiente consulta → nada de parpadeo a vacío entre teclas.
 */

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 110
const CACHE_LIMIT = 80

/** Caché a nivel de módulo: sobrevive a cerrar y reabrir el buscador. */
const cache = new Map<string, SearchPayload>()

function cacheKey(query: string): string {
  return foldText(query).replace(/\s+/g, " ").trim()
}

function remember(key: string, payload: SearchPayload) {
  if (cache.has(key)) cache.delete(key)
  cache.set(key, payload)
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

export type InstantSearchState = {
  payload: SearchPayload | null
  loading: boolean
  /** true mientras lo mostrado corresponde a una consulta anterior. */
  stale: boolean
}

export function useInstantSearch(query: string): InstantSearchState {
  const [state, setState] = useState<InstantSearchState>({
    payload: null,
    loading: false,
    stale: false,
  })
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort()
      abortRef.current = null
      requestIdRef.current += 1
      setState({ payload: null, loading: false, stale: false })
      return
    }

    const key = cacheKey(trimmed)
    const cached = cache.get(key)
    if (cached) {
      abortRef.current?.abort()
      abortRef.current = null
      requestIdRef.current += 1
      setState({ payload: cached, loading: false, stale: false })
      return
    }

    // Se conserva lo ya visible (marcado como stale) para no parpadear.
    setState((prev) => ({ payload: prev.payload, loading: true, stale: true }))

    const requestId = ++requestIdRef.current
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error(String(response.status))
        const json = (await response.json()) as { data?: SearchPayload | null }
        const payload = json.data
        if (!payload) throw new Error("respuesta vacía")

        remember(key, payload)
        // Guardia de orden: solo la petición más reciente puede pintar.
        if (requestId !== requestIdRef.current) return
        setState({ payload, loading: false, stale: false })
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        if (requestId !== requestIdRef.current) return
        setState((prev) => ({ payload: prev.payload, loading: false, stale: true }))
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return state
}
