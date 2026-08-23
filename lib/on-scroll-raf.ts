/**
 * Un solo listener de `scroll` en window. Los suscriptores corren juntos
 * en el siguiente animation frame, no en cada evento (el browser dispara
 * varios por frame y cada getBoundingClientRect ahí es un layout forzado).
 */

type ScrollFn = () => void

const listeners = new Set<ScrollFn>()
let attached = false
let rafId = 0

function flush() {
  rafId = 0
  for (const fn of listeners) fn()
}

function onScroll() {
  if (rafId) return
  rafId = window.requestAnimationFrame(flush)
}

function attach() {
  if (attached) return
  attached = true
  window.addEventListener("scroll", onScroll, { passive: true })
}

function detach() {
  if (listeners.size > 0) return
  attached = false
  if (rafId) {
    window.cancelAnimationFrame(rafId)
    rafId = 0
  }
  window.removeEventListener("scroll", onScroll)
}

export function subscribeWindowScroll(fn: ScrollFn): () => void {
  listeners.add(fn)
  attach()
  return () => {
    listeners.delete(fn)
    detach()
  }
}
