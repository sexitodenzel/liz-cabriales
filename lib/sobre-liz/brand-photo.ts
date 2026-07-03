/** Misma foto que el hero de /sobre-liz (slot `brand_photo` en landing_slots). */
export const SOBRE_LIZ_BRAND_PHOTO_FALLBACK =
  "https://picsum.photos/seed/liz/720/900"

export function resolveSobreLizBrandPhoto(url?: string | null): string {
  const trimmed = url?.trim()
  return trimmed || SOBRE_LIZ_BRAND_PHOTO_FALLBACK
}
