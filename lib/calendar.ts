// Utilidades para "Agregar al calendario" en la ficha de curso.
// Apple Calendar y Outlook consumen un archivo .ics; Google usa un link web.

const TZID = "America/Mexico_City"

// Duración por defecto de un taller cuando no hay hora de fin explícita (horas).
const DEFAULT_DURATION_HOURS = 4

export type CalendarEvent = {
  id: string
  title: string
  description: string
  location: string
  /** Fecha de inicio en formato "YYYY-MM-DD". */
  startDate: string
  /** Hora de inicio en formato "HH:MM" o "HH:MM:SS". */
  startTime: string
}

// Convierte "2026-07-11" + "10:00" en componentes de fecha/hora locales.
function parseParts(startDate: string, startTime: string) {
  const [y, mo, d] = startDate.split("-").map(Number)
  const [h, mi] = startTime.split(":").map(Number)
  return { y, mo, d, h: h || 0, mi: mi || 0 }
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

// Formato de fecha/hora "flotante" para calendarios: YYYYMMDDTHHMMSS (hora local).
function toStamp(y: number, mo: number, d: number, h: number, mi: number): string {
  return `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(mi)}00`
}

// Calcula inicio y fin (inicio + DEFAULT_DURATION_HOURS) como stamps locales.
function eventStamps(event: CalendarEvent) {
  const { y, mo, d, h, mi } = parseParts(event.startDate, event.startTime)
  const start = new Date(y, mo - 1, d, h, mi)
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000)
  return {
    start: toStamp(y, mo, d, h, mi),
    end: toStamp(
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes()
    ),
  }
}

// Escapa caracteres reservados del formato iCalendar.
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

// Genera el contenido de un archivo .ics para Apple Calendar / Outlook.
export function buildICS(event: CalendarEvent): string {
  const { start, end } = eventStamps(event)
  const dtstamp = toStamp(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
    new Date().getHours(),
    new Date().getMinutes()
  )
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Academia Liz Cabriales//Cursos//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:curso-${event.id}@lizcabriales.mx`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${TZID}:${start}`,
    `DTEND;TZID=${TZID}:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.join("\r\n")
}

// Dispara la descarga del .ics en el navegador (Apple Calendar / Outlook).
export function downloadICS(event: CalendarEvent) {
  const blob = new Blob([buildICS(event)], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `curso-${event.id}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Construye el link "agregar evento" de Google Calendar.
export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = eventStamps(event)
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location: event.location,
    ctz: TZID,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
