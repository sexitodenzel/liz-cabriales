export const WHATSAPP_PHONE_DISPLAY = "833 218 3399"
export const WHATSAPP_PHONE_E164 = "528332183399"

export const PICKUP_LOCATION_NAME = "Academia Liz Cabriales Studio"
export const PICKUP_LOCATION_ADDRESS =
  "Nayarit #204-B, C. Durango Esquina, Unidad Nacional, 89410 Cd Madero, Tamps."
export const PICKUP_LOCATION_HOURS = "Lunes a Sábado, 9:00 a.m. – 7:00 p.m."
export const PICKUP_READY_NOTE = "Normalmente está listo en 24 horas"
export const PICKUP_MAPS_URL =
  "https://maps.google.com/?q=Liz+Cabriales+Studio+Nayarit+204+Cd+Madero+Tamaulipas"

export function buildWhatsAppHref(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE_E164}?text=${encodeURIComponent(message)}`
}
