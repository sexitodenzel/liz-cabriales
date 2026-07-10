export const WHATSAPP_PHONE_DISPLAY = "833 218 3399"
export const WHATSAPP_PHONE_E164 = "528332183399"

// Ciudades donde ofrecemos entrega a domicilio con repartidor (pago directo al repartidor).
export const LOCAL_DELIVERY_CITIES = ["Tampico", "Cd. Madero", "Altamira"] as const
export type LocalDeliveryCity = (typeof LOCAL_DELIVERY_CITIES)[number]
export const LOCAL_DELIVERY_ZONES_LABEL = "Tampico, Cd. Madero y Altamira"

export const PICKUP_LOCATION_NAME = "Academia Liz Cabriales Studio"
export const PICKUP_LOCATION_ADDRESS =
  "Nayarit #204-B, C. Durango Esquina, Unidad Nacional, 89410 Cd Madero, Tamps."
export const PICKUP_LOCATION_HOURS =
  "Lun a Sáb 10:00 a.m. – 7:00 p.m. · Dom 10:00 a.m. – 2:00 p.m. (días de curso)"
export const PICKUP_READY_NOTE = "Normalmente está listo en 24 horas"
export const PICKUP_MAPS_URL =
  "https://maps.google.com/?q=Liz+Cabriales+Studio+Nayarit+204+Cd+Madero+Tamaulipas"

export function buildWhatsAppHref(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE_E164}?text=${encodeURIComponent(message)}`
}
