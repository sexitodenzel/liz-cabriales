const SUPABASE_FETCH_TIMEOUT_MS = 20_000

/**
 * fetch() con límite de tiempo para pasarle a `global.fetch` de los clientes
 * de Supabase. Sin esto, un socket colgado (p. ej. tras suspender la laptop,
 * un bache de red, o un cold start lento del proyecto) hace que fetch()
 * espere al timeout TCP del SO — hasta minutos — antes de que los reintentos
 * de la capa de arriba puedan actuar. 20s da margen a queries pesadas o a un
 * cold start real sin dejar una request colgada indefinidamente.
 */
export function timeoutFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS)
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}
