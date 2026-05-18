export const WHATSAPP_PHONE_DISPLAY = "833 218 3399"
export const WHATSAPP_PHONE_E164 = "528332183399"

export function buildWhatsAppHref(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE_E164}?text=${encodeURIComponent(message)}`
}
