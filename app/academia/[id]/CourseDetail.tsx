"use client"

import { useState } from "react"
import Image from "next/image"
import type { CourseWithStats, CourseGalleryItem } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"
import { buildWhatsAppHref } from "@/lib/constants/contact"
import {
  buildGoogleCalendarUrl,
  downloadICS,
  type CalendarEvent,
} from "@/lib/calendar"
import RegisterModal from "@/components/courses/RegisterModal"
import Breadcrumb from "@/components/shared/Breadcrumb"
import CourseGallery from "./CourseGallery"

type Props = {
  course: CourseWithStats
  isPast: boolean
  isAuthenticated: boolean
  alreadyRegistered: boolean
  pendingRegistrationId: string | null
  minDeposit: number
  gallery: CourseGalleryItem[]
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

function CompassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m16 8-2 6-6 2 2-6 6-2Z" />
    </svg>
  )
}

function CalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function ShareIcon({ title }: { title: string }) {
  return (
    <button
      title={title}
      className="grid h-9 w-9 place-items-center rounded-full border border-[#ececec] bg-white text-[#6b6b6b] transition-all hover:border-[#c9a84c] hover:text-[#a8893a]"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
    </button>
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
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

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

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveIdx((idx) => (idx - 1 + allImages.length) % allImages.length)}
                      aria-label="Imagen anterior"
                      className="absolute left-3 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 sm:left-5 sm:h-10 sm:w-10"
                    >
                      <ChevronIcon dir="left" />
                    </button>
                    <button
                      onClick={() => setActiveIdx((idx) => (idx + 1) % allImages.length)}
                      aria-label="Siguiente imagen"
                      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 sm:right-5 sm:h-10 sm:w-10"
                    >
                      <ChevronIcon dir="right" />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIdx(i)}
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
            <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 py-5 sm:px-14 sm:py-12 text-white">
              <div className="mb-2 sm:mb-3.5 flex items-center gap-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[#c9a84c]">
                <span className="h-px w-5 sm:w-7 bg-[#c9a84c]" />
                {isPast ? "Edición realizada · " : ""}
                {LEVEL_LABEL[course.level]} · {dayName} {day} {monthFull} {year}
              </div>
              <h1
                className="mb-2 sm:mb-3.5 max-w-[720px] text-[clamp(20px,5vw,56px)] font-medium leading-tight sm:leading-none tracking-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
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
                  <span className="inline-block h-2 w-2 rounded-full bg-[#c9a84c]" />
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
                      ? "border-[#c9a84c] opacity-100"
                      : "border-transparent opacity-60 hover:opacity-90"
                  }`}
                >
                  <Image
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
              <h2
                className="mb-1 text-[28px] font-medium tracking-tight text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {isPast ? "Sobre la edición" : "Sobre el taller"}
              </h2>
              <div className="mb-5 h-0.5 w-9 bg-[#c9a84c]" />
              <div className="text-[15px] leading-[1.7] text-[#3a3a3a]">
                <p className="whitespace-pre-line">{course.description}</p>
              </div>

              {/* Level pill */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-3.5 py-[6px] text-[12px] font-medium tracking-[0.04em] text-[#a8893a]">
                  {LEVEL_LABEL[course.level]}
                </span>
                <span className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-3.5 py-[6px] text-[12px] font-medium tracking-[0.04em] text-[#a8893a]">
                  Diploma incluido
                </span>
              </div>
            </section>

            {/* Organizer */}
            <section className="mb-11">
              <h2
                className="mb-1 text-[28px] font-medium tracking-tight text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Organizador
              </h2>
              <div className="mb-5 h-0.5 w-9 bg-[#c9a84c]" />

              {course.instructor ? (
                <div className="flex items-center gap-4 rounded-[10px] border border-[#ececec] bg-white p-5">
                  {course.instructor.photo_url ? (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-[1.5px] border-[#c9a84c]">
                      <Image
                        src={course.instructor.photo_url}
                        alt={course.instructor.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#c9a84c] bg-[#f5efdc] text-xl font-semibold italic text-[#a8893a]"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      {initials(course.instructor.name)}
                    </div>
                  )}
                  <div>
                    <div className="mb-0.5 text-[15px] font-semibold text-[#1a1a1a]">
                      {course.instructor.name}
                    </div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#6b6b6b]">
                      {course.instructor.title || "Instructor(a)"} · Academia Liz Cabriales
                    </div>
                    {course.instructor.bio && (
                      <p className="mb-3 text-[13px] leading-relaxed text-[#3a3a3a]">
                        {course.instructor.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-[13px] text-[#3a3a3a]">
                      <span className="flex items-center gap-1.5 text-[#9a9a9a]">
                        <PhoneIcon /> +52 833 159 7446
                      </span>
                      <span className="flex items-center gap-1.5 text-[#9a9a9a]">
                        <MailIcon /> contacto@lizcabriales.mx
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[10px] border border-[#ececec] bg-white p-5 text-[13px] text-[#6b6b6b]">
                  Academia Liz Cabriales
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <aside className="sticky top-6 rounded-xl border border-[#ececec] bg-[#fafafa] p-7">
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
                    {course.start_time.slice(0, 5)}{" "}
                    <span className="text-[#c9a84c]">→</span>
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
                    className="flex flex-1 items-center justify-center rounded-[10px] border border-[#ececec] bg-white p-2.5 text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#a8893a]"
                  >
                    <CalIcon />
                  </button>
                  <button
                    type="button"
                    title="Outlook"
                    aria-label="Agregar a Outlook"
                    onClick={() => downloadICS(calendarEvent)}
                    className="flex flex-1 items-center justify-center rounded-[10px] border border-[#ececec] bg-white p-2.5 text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#a8893a]"
                  >
                    <CalIcon />
                  </button>
                  <a
                    href={buildGoogleCalendarUrl(calendarEvent)}
                    target="_blank"
                    rel="noreferrer"
                    title="Google Calendar"
                    aria-label="Agregar a Google Calendar"
                    className="flex flex-1 items-center justify-center rounded-[10px] border border-[#ececec] bg-white p-2.5 text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#a8893a]"
                  >
                    <CalIcon />
                  </a>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="mb-5 border-b border-[#ececec] pb-5">
              <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">
                Ubicación
              </div>
              <address className="mb-3.5 not-italic whitespace-pre-line text-[13.5px] leading-[1.55] text-[#3a3a3a]">
                <strong className="block text-[14px] font-semibold text-[#1a1a1a]">
                  {course.location}
                </strong>
              </address>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ececec] bg-white px-3.5 py-2.5 text-[13px] text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#a8893a]">
                <CompassIcon /> Obtener direcciones
              </button>
            </div>

            {/* Share */}
            <div className="mb-5 border-b border-[#ececec] pb-5">
              <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">
                Compartir
              </div>
              <p className="mb-3 text-[12.5px] leading-relaxed text-[#6b6b6b]">
                {isPast
                  ? "Comparte el recuerdo con tu comunidad."
                  : "Comparte este evento con tu comunidad."}
              </p>
              <div className="flex gap-2">
                {["Facebook", "Instagram", "WhatsApp", "X", "Copiar enlace"].map((s) => (
                  <ShareIcon key={s} title={s} />
                ))}
              </div>
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
                    className="flex w-full flex-col items-center rounded-[10px] bg-[#c9a84c] px-5 py-4 text-center text-[14px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_4px_14px_rgba(201,168,76,0.3)] transition-all hover:bg-[#a8893a] hover:shadow-[0_6px_18px_rgba(201,168,76,0.45)] active:translate-y-px"
                  >
                    {isFull ? "Consultar disponibilidad" : "Pedir información"}
                    <span className="mt-1 block text-[11px] font-normal tracking-[0.14em] opacity-85">
                      Te respondemos por WhatsApp
                    </span>
                  </a>

                  {course.show_capacity_public && (
                    <div className="mt-4 text-center text-[12px] text-[#6b6b6b]">
                      {course.public_confirmed_count} de {course.public_display_capacity} lugares · quedan {remaining}
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eee]">
                        <div
                          className="h-full rounded-full bg-[#c9a84c] transition-all duration-500"
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
                    className="flex w-full flex-col items-center rounded-[10px] bg-[#c9a84c] px-5 py-4 text-[14px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_4px_14px_rgba(201,168,76,0.3)] transition-all hover:bg-[#a8893a] hover:shadow-[0_6px_18px_rgba(201,168,76,0.45)] active:translate-y-px"
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
                          className="h-full rounded-full bg-[#c9a84c] transition-all duration-500"
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
    </>
  )
}
