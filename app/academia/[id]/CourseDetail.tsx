"use client"

import { useState } from "react"
import Image from "next/image"
import SmoothImage from "@/app/components/shared/SmoothImage"
import type { CourseWithStats, CourseGalleryItem } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"
import { buildWhatsAppHref } from "@/lib/constants/contact"
import { navSticky } from "@/lib/nav-sticky"
import {
  buildGoogleCalendarUrl,
  downloadICS,
  type CalendarEvent,
} from "@/lib/calendar"
import RegisterModal from "@/components/courses/RegisterModal"
import Breadcrumb from "@/components/shared/Breadcrumb"
import RichText from "@/components/shared/RichText"
import ImageLightbox from "@/app/components/shared/ImageLightbox"
import CourseGallery from "./CourseGallery"

type Props = {
  course: CourseWithStats
  isPast: boolean
  isAuthenticated: boolean
  alreadyRegistered: boolean
  pendingRegistrationId: string | null
  minDeposit: number
  gallery: CourseGalleryItem[]
  lizPhotoUrl: string | null
}

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  open: "Abierto",
}

const MONTHS_FULL = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

const DAYS_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
]

function parseDateFull(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return {
    day: d,
    monthFull: MONTHS_FULL[m - 1],
    year: y,
    dayName: DAYS_ES[date.getDay()],
  }
}

function formatPrice(value: number): string {
  return "$ " + value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((s) => s[0]).join("")
}

// ── Icons ──────────────────────────────────────────────────────────────────

// ── Brand logos (Agregar al calendario) ─────────────────────────────────────

function AppleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 384 512" aria-hidden="true">
      <path fill="#000" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}

function OutlookLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="20" y="14" width="24" height="20" rx="2" fill="#0F6CBD" />
      <path fill="#fff" d="M20 16.5l12 8 12-8V19l-12 8-12-8z" />
      <rect x="4" y="10" width="22" height="28" rx="3" fill="#0A4C8B" />
      <ellipse cx="15" cy="24" rx="6" ry="7" fill="none" stroke="#fff" strokeWidth="3.5" />
    </svg>
  )
}

function GoogleCalendarLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="9" y="9" width="30" height="30" rx="4" fill="#fff" />
      <path fill="#EA4335" d="M9 13a4 4 0 0 1 4-4h4v8H9z" />
      <path fill="#4285F4" d="M17 9h14v8H17z" />
      <path fill="#FBBC04" d="M31 9h4a4 4 0 0 1 4 4v4h-8z" />
      <path fill="#34A853" d="M9 31h30v4a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z" />
      <rect x="9" y="17" width="30" height="14" fill="#fff" />
      <text x="24" y="28.5" fontSize="12" fontWeight="700" fill="#1a73e8"
        textAnchor="middle" fontFamily="Arial, sans-serif">31</text>
    </svg>
  )
}

const shareIconClass =
  "grid h-9 w-9 place-items-center rounded-full border border-[#ececec] bg-white text-[#6b6b6b] transition-all hover:border-[#c6a75e] hover:text-[#c6a75e]"

function FacebookGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}

function WhatsAppGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.5 9.5 0 01-4.84-1.33l-.35-.2-3.6.94.96-3.51-.23-.36a9.46 9.46 0 01-1.45-5.05c0-5.24 4.27-9.5 9.52-9.5 2.54 0 4.93.99 6.73 2.79a9.46 9.46 0 012.78 6.72c0 5.24-4.27 9.5-9.5 9.5zM20.52 3.48A11.85 11.85 0 0012.05.02C5.5.02.16 5.35.16 11.9c0 2.1.55 4.14 1.6 5.95L.06 24l6.3-1.65a11.9 11.9 0 005.68 1.45h.01c6.55 0 11.89-5.33 11.89-11.88 0-3.18-1.24-6.16-3.42-8.44z" />
    </svg>
  )
}

function XGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.65l7.73-8.84L1.23 2.25h6.83l4.71 6.23 5.47-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z" />
    </svg>
  )
}

function TelegramGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.95 4.57l-3.62 17.06c-.27 1.2-.98 1.5-1.99.93l-5.5-4.05-2.65 2.55c-.29.29-.54.54-1.1.54l.39-5.56 10.12-9.14c.44-.39-.1-.61-.68-.22L6.4 13.68l-5.4-1.69c-1.17-.37-1.2-1.17.25-1.73L22.43 2.9c.98-.36 1.83.22 1.52 1.67z" />
    </svg>
  )
}

function LinkGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ShareButtons({ shareText }: { shareText: string }) {
  const [copied, setCopied] = useState(false)

  const currentUrl = () =>
    typeof window !== "undefined" ? window.location.href : ""

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=620,height=680")
  }

  const shareTo = (network: "facebook" | "whatsapp" | "x" | "telegram") => {
    const url = currentUrl()
    const u = encodeURIComponent(url)
    const t = encodeURIComponent(shareText)
    switch (network) {
      case "facebook":
        openShare(`https://www.facebook.com/sharer/sharer.php?u=${u}`)
        break
      case "whatsapp":
        openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`)
        break
      case "x":
        openShare(`https://twitter.com/intent/tweet?text=${t}&url=${u}`)
        break
      case "telegram":
        openShare(`https://t.me/share/url?url=${u}&text=${t}`)
        break
    }
  }

  const copyLink = async () => {
    const url = currentUrl()
    try {
      // Compartir nativo en móvil (abre la hoja del sistema con todas las apps).
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: shareText, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Cancelado por el usuario o sin permisos: no hacemos nada.
    }
  }

  return (
    <div className="flex w-full justify-between">
      <button type="button" title="Compartir en Facebook" aria-label="Compartir en Facebook"
        onClick={() => shareTo("facebook")} className={shareIconClass}>
        <FacebookGlyph />
      </button>
      <button type="button" title="Compartir en WhatsApp" aria-label="Compartir en WhatsApp"
        onClick={() => shareTo("whatsapp")} className={shareIconClass}>
        <WhatsAppGlyph />
      </button>
      <button type="button" title="Compartir en X" aria-label="Compartir en X"
        onClick={() => shareTo("x")} className={shareIconClass}>
        <XGlyph />
      </button>
      <button type="button" title="Compartir en Telegram" aria-label="Compartir en Telegram"
        onClick={() => shareTo("telegram")} className={shareIconClass}>
        <TelegramGlyph />
      </button>
      <button type="button" title={copied ? "¡Enlace copiado!" : "Copiar enlace"}
        aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
        onClick={copyLink}
        className={`${shareIconClass} ${copied ? "border-[#c6a75e] text-[#c6a75e]" : ""}`}>
        {copied ? <CheckGlyph /> : <LinkGlyph />}
      </button>
    </div>
  )
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left"
        ? <path d="m15 18-6-6 6-6" />
        : <path d="m9 18 6-6-6-6" />}
    </svg>
  )
}

export default function CourseDetail({
  course,
  isPast,
  isAuthenticated,
  alreadyRegistered,
  pendingRegistrationId,
  minDeposit,
  gallery,
  lizPhotoUrl,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const allImages =
    course.images.length > 0
      ? course.images.map((img) => img.image_url)
      : course.cover_image
        ? [course.cover_image]
        : []

  const { day, monthFull, year, dayName } = parseDateFull(course.start_date)
  const isFull = course.show_capacity_public
    ? course.public_spots_remaining <= 0
    : course.spots_remaining <= 0
  const canRegisterOnline = course.allow_online_registration
  const enrolledPct = Math.min(
    100,
    Math.round(
      (course.public_confirmed_count / course.public_display_capacity) * 100
    )
  )
  const remaining = course.public_spots_remaining

  // Mensaje prellenado de WhatsApp con nombre del taller, fecha y apartado.
  const depositText =
    minDeposit > 0
      ? ` ¿Me podrían compartir los detalles para el apartado de $${minDeposit.toLocaleString(
          "es-MX"
        )} pesos?`
      : " ¿Me podrían compartir los detalles para inscribirme?"
  const whatsAppHref = buildWhatsAppHref(
    `¡Hola, Academia Liz Cabriales! Me interesa inscribirme al taller de ${course.title} del ${day} de ${monthFull}.${depositText}`
  )

  // Evento para "Agregar al calendario" (Apple / Outlook / Google).
  const calendarEvent: CalendarEvent = {
    id: course.id,
    title: `${course.title} · Academia Liz Cabriales`,
    description: course.short_description || course.description.slice(0, 300),
    location: course.location,
    startDate: course.start_date,
    startTime: course.start_time,
  }

  return (
    <>
      <div className="site-container pt-5 pb-20">
        <Breadcrumb
          items={[
            {
              label: isPast ? "Eventos pasados" : "Todos los eventos",
              href: "/academia",
            },
            { label: course.title },
          ]}
        />

        {/* Hero / Slider */}
        <div className="mb-4 w-full">
          <div className="relative overflow-hidden rounded-[14px] bg-[#111] aspect-[4/3] sm:aspect-[16/5.6]">
            {allImages.length > 0 ? (
              <>
                {allImages.map((url, i) => (
                  <Image
                    key={i}
                    src={url}
                    alt={i === 0 ? course.title : `${course.title} - imagen ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className={`object-cover transition-opacity duration-500 ${
                      i === activeIdx ? "opacity-[0.78]" : "opacity-0"
                    }`}
                  />
                ))}

                {/* Zona de zoom: bajo flechas/dots (z-20). Abre la imagen completa. */}
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Ampliar imagen"
                  className="absolute inset-0 z-10 cursor-zoom-in"
                />

                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveIdx((idx) => (idx - 1 + allImages.length) % allImages.length)
                      }}
                      aria-label="Imagen anterior"
                      className="absolute left-3 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 sm:left-5 sm:h-10 sm:w-10"
                    >
                      <ChevronIcon dir="left" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveIdx((idx) => (idx + 1) % allImages.length)
                      }}
                      aria-label="Siguiente imagen"
                      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 sm:right-5 sm:h-10 sm:w-10"
                    >
                      <ChevronIcon dir="right" />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveIdx(i)
                          }}
                          aria-label={`Ir a imagen ${i + 1}`}
                          className={`rounded-full transition-all duration-300 ${
                            i === activeIdx
                              ? "h-2 w-6 bg-white"
                              : "h-2 w-2 bg-white/55 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#9a9a9a]">
                Sin imagen
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.25)_50%,rgba(0,0,0,0.55)_100%)]" />
            <div className="pointer-events-none absolute inset-0 z-[11] flex flex-col justify-end px-5 py-5 sm:px-14 sm:py-12 text-white">
              <div className="mb-2 sm:mb-3.5 flex items-center gap-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[#c6a75e]">
                <span className="h-px w-5 sm:w-7 bg-[#c6a75e]" />
                {isPast ? "Edición realizada · " : ""}
                {LEVEL_LABEL[course.level]} · {dayName} {day} {monthFull} {year}
              </div>
              <h1
                className="mb-2 sm:mb-3.5 max-w-[720px] text-[clamp(20px,4.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
              >
                {course.title}
              </h1>
              <p className="hidden sm:block line-clamp-2 max-w-[580px] text-[16px] leading-relaxed text-white/85">
                {course.short_description
                  ? course.short_description
                  : `${course.description.slice(0, 160)}${
                      course.description.length > 160 ? "…" : ""
                    }`}
              </p>
              {isPast && course.show_capacity_public && (
                <div className="mt-4 flex items-center gap-2 text-[13px] text-white/90">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#c6a75e]" />
                  Este evento ya se realizó · {course.public_confirmed_count} asistentes
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === activeIdx
                      ? "border-[#c6a75e] opacity-100"
                      : "border-transparent opacity-60 hover:opacity-90"
                  }`}
                >
                  <SmoothImage
                    src={url}
                    alt={`Imagen ${i + 1}`}
                    width={108}
                    height={72}
                    className="h-16 w-24 object-cover sm:h-[72px] sm:w-[108px]"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className={`grid grid-cols-1 items-start gap-14 lg:grid-cols-[1fr_380px] ${allImages.length > 1 ? "mt-6" : "mt-10"}`}>
          {/* ── Left column ──────────────────────────────────────────── */}
          <div>
            {/* About the workshop */}
            <section className="mb-11">
              <h2 className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]">
                {isPast ? "Sobre la edición" : "Sobre el taller"}
              </h2>
              <div className="mb-5 mt-5 h-0.5 w-9 bg-[#c6a75e]" />
              <RichText text={course.description} />

              {/* Chips / distintivos */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-3.5 py-[6px] text-[12px] font-medium tracking-[0.04em] text-[#c6a75e]">
                  {LEVEL_LABEL[course.level]}
                </span>
                {course.diploma_included && (
                  <span className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-3.5 py-[6px] text-[12px] font-medium tracking-[0.04em] text-[#c6a75e]">
                    Diploma incluido
                  </span>
                )}
                {course.highlights.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-3.5 py-[6px] text-[12px] font-medium tracking-[0.04em] text-[#c6a75e]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </section>

            {/* Instructor — última sección: SIN margin inferior. Es grid item
                (crea BFC), así que un mb-11 aquí no colapsa y sumaría 44px al
                alto de la columna izquierda; el sticky de la derecha se alinea
                al fondo de esa columna y quedaría 44px por debajo de la base de
                la cajita de maestro invitado ("se pasaba"). El aire inferior lo
                da el pb-20 del contenedor. */}
            <section>
              <h2 className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]">
                Respaldado por
              </h2>
              <div className="mb-5 mt-5 h-0.5 w-9 bg-[#c6a75e]" />

              {/* Organiza — mismo chrome que el sidebar de fecha (agosto). */}
              <div className="flex items-center gap-4 rounded-xl border border-[#ececec] bg-[#fafafa] p-6">
                {lizPhotoUrl ? (
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-[#e0e0e0]">
                    <SmoothImage
                      src={lizPhotoUrl}
                      alt="Liz Cabriales"
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] bg-white">
                    <Image
                      src="/images/logo.png"
                      alt="Academia Liz Cabriales"
                      width={38}
                      height={38}
                      className="h-[38px] w-[38px] object-contain"
                    />
                  </span>
                )}
                <div>
                  <div className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-[#c6a75e]">
                    Organiza e imparte
                  </div>
                  <div className="text-[15px] font-semibold text-[#1a1a1a]">
                    Liz Cabriales
                  </div>
                  <div className="text-[12px] text-[#6b6b6b]">
                    Fundadora · Academia Liz Cabriales
                  </div>
                </div>
              </div>

              {/* Co-organizadores (opcional) — junto a Liz */}
              {course.co_organizers.map((org) => (
                <div
                  key={org.id}
                  className="mt-3 flex items-center gap-4 rounded-xl border border-[#ececec] bg-[#fafafa] p-6"
                >
                  {org.photo_url ? (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-[#e0e0e0]">
                      <SmoothImage
                        src={org.photo_url}
                        alt={org.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] bg-[#f5efdc] text-xl font-semibold italic text-[#c6a75e]"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      {initials(org.name)}
                    </div>
                  )}
                  <div>
                    <div className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-[#c6a75e]">
                      {org.title || "Organiza"}
                    </div>
                    <div className="text-[15px] font-semibold text-[#1a1a1a]">
                      {org.name}
                    </div>
                    {org.bio && (
                      <p className="mt-1.5 text-[13px] leading-relaxed text-[#3a3a3a]">
                        {org.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Maestros invitados — secundarios (principal + adicionales) */}
              {[course.instructor, ...course.co_instructors]
                .filter((g): g is NonNullable<typeof g> => Boolean(g))
                .map((guest) => (
                  <div
                    key={guest.id}
                    className="mt-3 flex items-center gap-4 rounded-xl border border-[#ececec] bg-[#fafafa] p-6"
                  >
                    {guest.photo_url ? (
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-[#e0e0e0]">
                        <SmoothImage
                          src={guest.photo_url}
                          alt={guest.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] bg-[#f5efdc] text-xl font-semibold italic text-[#c6a75e]"
                        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                      >
                        {initials(guest.name)}
                      </div>
                    )}
                    <div>
                      <div className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-[#c6a75e]">
                        {guest.title || "Maestro invitado"}
                      </div>
                      <div className="text-[15px] font-semibold text-[#1a1a1a]">
                        {guest.name}
                      </div>
                      {guest.bio && (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[#3a3a3a]">
                          {guest.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </section>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────
              Receta "plain" (ver lib/nav-sticky): sticky sin follow. Con el
              hero tan alto, seguir el colapso obligaba a guard + park y esas
              dos transiciones de 480ms se pisaban ("se pasaba" la última
              cajita). Sin transform no hay salto; al colapsar solo queda algo
              más de aire arriba del card. La columna izquierda termina SIN
              margin (ver su última <section>) para que el fondo del sticky
              caiga a ras de la cajita de maestro invitado. */}
          <aside {...navSticky("plain", "rounded-xl border border-[#ececec] bg-[#fafafa] p-7")}>
            {/* Date block */}
            <div className="mb-5 border-b border-[#ececec] pb-5">
              <div className="flex items-center gap-[18px]">
                <span
                  className="text-[56px] font-medium leading-none text-[#1a1a1a]"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {String(day).padStart(2, "0")}
                </span>
                <div>
                  <div className="text-[13px] tracking-[0.04em] text-[#3a3a3a]">
                    {monthFull} {year}
                  </div>
                  <div className="text-[13px] text-[#6b6b6b]">{dayName}</div>
                  <div className="mt-1.5 text-[14px] font-medium text-[#1a1a1a]">
                    {course.start_time.slice(0, 5)}
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar buttons (upcoming only) */}
            {!isPast && (
              <div className="mb-5 border-b border-[#ececec] pb-5">
                <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">
                  Agregar al calendario
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    title="Apple Calendar"
                    aria-label="Agregar a Apple Calendar"
                    onClick={() => downloadICS(calendarEvent)}
                    className="flex flex-1 items-center justify-center rounded-[10px] border border-[#ececec] bg-white p-2.5 transition-all hover:border-[#c6a75e] hover:bg-[#fdfaf0]"
                  >
                    <AppleLogo />
                  </button>
                  <button
                    type="button"
                    title="Outlook"
                    aria-label="Agregar a Outlook"
                    onClick={() => downloadICS(calendarEvent)}
                    className="flex flex-1 items-center justify-center rounded-[10px] border border-[#ececec] bg-white p-2.5 transition-all hover:border-[#c6a75e] hover:bg-[#fdfaf0]"
                  >
                    <OutlookLogo />
                  </button>
                  <a
                    href={buildGoogleCalendarUrl(calendarEvent)}
                    target="_blank"
                    rel="noreferrer"
                    title="Google Calendar"
                    aria-label="Agregar a Google Calendar"
                    className="flex flex-1 items-center justify-center rounded-[10px] border border-[#ececec] bg-white p-2.5 transition-all hover:border-[#c6a75e] hover:bg-[#fdfaf0]"
                  >
                    <GoogleCalendarLogo />
                  </a>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="mb-5 border-b border-[#ececec] pb-5">
              <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">
                Ubicación
              </div>
              <address className="not-italic whitespace-pre-line text-[13.5px] leading-[1.55] text-[#3a3a3a]">
                <strong className="block text-[14px] font-semibold text-[#1a1a1a]">
                  {course.location}
                </strong>
              </address>
            </div>

            {/* Share */}
            <div className="mb-5 border-b border-[#ececec] pb-5">
              <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">
                Compartir
              </div>
              <ShareButtons
                shareText={
                  isPast
                    ? `Recuerdos del taller de ${course.title} · Academia Liz Cabriales`
                    : `Te invito al taller de ${course.title} el ${day} de ${monthFull} en ${course.location} · Academia Liz Cabriales`
                }
              />
            </div>

            {/* CTA */}
            <div>
              {isPast ? (
                <div className="rounded-lg border border-[#ececec] bg-white px-5 py-4 text-center text-[13px] text-[#6b6b6b]">
                  {course.show_capacity_public ? (
                    <>
                      <div className="mb-1 text-[15px] font-semibold text-[#1a1a1a]">
                        {course.public_confirmed_count}
                      </div>
                      Asistentes a esta edición
                    </>
                  ) : (
                    "Edición realizada"
                  )}
                </div>
              ) : alreadyRegistered ? (
                <div className="rounded-lg bg-emerald-50 px-5 py-4 text-center text-[13px] font-semibold text-emerald-700">
                  Ya estás inscrito en este curso
                </div>
              ) : !canRegisterOnline ? (
                <>
                  <a
                    href={whatsAppHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center rounded-full bg-[#1a1a1a] px-5 py-4 text-center text-[14px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all hover:bg-black hover:shadow-[0_6px_18px_rgba(0,0,0,0.28)] active:translate-y-px"
                  >
                    {isFull ? "Consultar disponibilidad" : "Pedir información"}
                  </a>

                  {course.show_capacity_public && (
                    <div className="mt-4 text-center text-[12px] text-[#6b6b6b]">
                      {course.public_confirmed_count} de {course.public_display_capacity} lugares · quedan {remaining}
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eee]">
                        <div
                          className="h-full rounded-full bg-[#c6a75e] transition-all duration-500"
                          style={{ width: `${enrolledPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : isFull ? (
                <div className="rounded-lg bg-red-50 px-5 py-4 text-center text-[13px] font-semibold text-red-700">
                  Curso lleno
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex w-full flex-col items-center rounded-[10px] bg-[#c6a75e] px-5 py-4 text-[14px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_4px_14px_rgba(201,168,76,0.3)] transition-all hover:bg-[#c6a75e] hover:shadow-[0_6px_18px_rgba(201,168,76,0.45)] active:translate-y-px"
                  >
                    Registrar
                    {course.show_price_public && (
                      <span className="mt-1 block text-[11px] font-normal tracking-[0.14em] opacity-85">
                        {formatPrice(course.price)} MXN · IVA incluido
                      </span>
                    )}
                  </button>

                  {/* Capacity bar */}
                  {course.show_capacity_public && (
                    <div className="mt-4 text-center text-[12px] text-[#6b6b6b]">
                      {course.public_confirmed_count} de {course.public_display_capacity} lugares · quedan {remaining}
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eee]">
                        <div
                          className="h-full rounded-full bg-[#c6a75e] transition-all duration-500"
                          style={{ width: `${enrolledPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Deposit info */}
                  {course.show_price_public && minDeposit > 0 && minDeposit < course.price && (
                    <p className="mt-3 text-center text-[11px] leading-relaxed text-[#9a9a9a]">
                      Apartado mínimo {formatPrice(minDeposit)} · el saldo se liquida antes del curso
                    </p>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Galería retrospectiva */}
      {isPast && gallery.length > 0 && (
        <div className="site-container">
          <CourseGallery items={gallery} />
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <RegisterModal
          course={course}
          isAuthenticated={isAuthenticated}
          pendingRegistrationId={pendingRegistrationId}
          onClose={() => setModalOpen(false)}
        />
      )}

      {lightboxOpen && allImages.length > 0 && (
        <ImageLightbox
          images={allImages}
          startIndex={activeIdx}
          alt={course.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
