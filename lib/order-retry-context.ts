const STORAGE_KEY = "order-retry-context"
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function setOrderRetryContext(orderId: string): void {
  if (typeof window === "undefined") return
  if (!UUID_REGEX.test(orderId)) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, orderId)
  } catch {
    // sessionStorage no disponible — ignorar
  }
}

export function getOrderRetryContext(): string | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    return value && UUID_REGEX.test(value) ? value : null
  } catch {
    return null
  }
}

export function clearOrderRetryContext(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignorar
  }
}
