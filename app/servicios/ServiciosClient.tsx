"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Plus, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type {
  AppointmentRecord,
  ProfessionalRow,
  ServiceFilterRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import { professionalMatchesServiceFilters } from "@/lib/professionalFilters"
import { navSticky } from "@/lib/nav-sticky"
import ServiceOptionsPicker, {
  buildServiceSelections,
  resolveServiceOptions,
  sumSelectedOptions,
} from "@/components/shared/ServiceOptionsPicker"
import {
  buildBookableDates,
  type StudioWeeklyHourRow,
} from "@/lib/appointments/studio-hours"

import BookingSummary from "./components/BookingSummary"
import FullCalendarModal from "./components/FullCalendarModal"
import StickyContinueBar from "./components/StickyContinueBar"
import TransferPaymentModal from "./components/TransferPaymentModal"

type Slot = {
  start_time: string
  end_time: string
  professional_id: string
}

type Step = 1 | 2 | 3 | 4

type Props = {
  services: ServiceWithOptions[]
  filters: ServiceFilterRow[]
  professionals: ProfessionalRow[]
  studioWeeklyHours: StudioWeeklyHourRow[]
  isAuthenticated: boolean
  activeAppointment: AppointmentRecord | null
  transferAccountNumber: string
}

const STEP_LABELS: Record<Step, string> = {
  1: "Servicios",
  2: "Profesional",
  3: "Hora",
  4: "Confirmar",
}
const TOTAL_STEPS = 4

const DEFAULT_FILTERS: ServiceFilterRow[] = [
  { id: "manos", name: "Manos", slug: "manos", sort_order: 1, is_active: true },
  { id: "pies", name: "Pies", slug: "pies", sort_order: 2, is_active: true },
]

const SELECTED_CARD =
  "border-2 border-neutral-900 bg-white"
const DEFAULT_CARD =
  "border border-neutral-200/80 bg-white hover:border-neutral-400"

function formatPrice(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

function prettyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0]
  return part || name
}

function groupSlotsByPeriod(slots: Slot[]) {
  const morning: Slot[] = []
  const afternoon: Slot[] = []
  for (const slot of slots) {
    const hh = Number(slot.start_time.slice(0, 2))
    if (hh < 12) morning.push(slot)
    else afternoon.push(slot)
  }
  return { morning, afternoon }
}

const QUICK_PICK_DAYS = 30
const CALENDAR_HORIZON_DAYS = 90

function IconX() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconShuffle() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconSun({ morning }: { morning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {morning ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </>
      ) : (
        <>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
          <circle cx="12" cy="12" r="4" />
        </>
      )}
    </svg>
  )
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[#111]" />
  )
}

function StepHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <header className="mb-6 md:mb-8">
      <h1 className="text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-[#0a0a0a]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-neutral-500">
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}

function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
  disabled = false,
}: {
  slots: Slot[]
  selectedSlot: Slot | null
  onSelect: (slot: Slot) => void
  disabled?: boolean
}) {
  if (slots.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {slots.map((slot) => {
        const active =
          selectedSlot?.start_time === slot.start_time &&
          selectedSlot?.professional_id === slot.professional_id
        return (
          <button
            key={`${slot.professional_id}-${slot.start_time}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(slot)}
            className={`rounded-lg border py-3 text-[13px] font-medium transition-all duration-200 disabled:cursor-wait ${
              active
                ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                : "border-neutral-200/80 bg-white text-[#111] hover:border-neutral-400"
            }`}
          >
            {formatTimeLabel(slot.start_time)}
          </button>
        )
      })}
    </div>
  )
}

export default function ServiciosClient({
  services,
  filters: initialFilters,
  professionals,
  studioWeeklyHours,
  isAuthenticated,
  activeAppointment: initialActiveAppointment,
  transferAccountNumber: initialTransferAccountNumber,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transferAccountNumber, setTransferAccountNumber] = useState(
    initialTransferAccountNumber
  )
  const [modalAppointment, setModalAppointment] =
    useState<AppointmentRecord | null>(initialActiveAppointment)

  const [step, setStep] = useState<Step>(1)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedOptionsByService, setSelectedOptionsByService] = useState<
    Record<string, string[]>
  >({})
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | "any" | null
  >(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("")
  const categoryClickLockRef = useRef(false)
  const [descExpandedId, setDescExpandedId] = useState<string | null>(null)
  const [optionsExpandedId, setOptionsExpandedId] = useState<string | null>(
    null
  )
  const [notes, setNotes] = useState("")
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [fullCalendarOpen, setFullCalendarOpen] = useState(false)
  const [proPickerOpen, setProPickerOpen] = useState(false)
  const proPickerRef = useRef<HTMLDivElement>(null)

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  )

  const requiredFilterIds = useMemo(() => {
    const ids = new Set<string>()
    for (const service of selectedServices) {
      if (service.filter_id) ids.add(service.filter_id)
    }
    return ids
  }, [selectedServices])

  const eligibleProfessionals = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          professional.is_active &&
          professionalMatchesServiceFilters(professional, requiredFilterIds)
      ),
    [professionals, requiredFilterIds]
  )

  const optionTotals = useMemo(
    () => sumSelectedOptions(selectedServices, selectedOptionsByService),
    [selectedServices, selectedOptionsByService]
  )

  const totalPrice = selectedServices.reduce((a, s) => a + s.price, 0) + optionTotals.price
  const totalDuration =
    selectedServices.reduce((a, s) => a + s.duration_min, 0) +
    optionTotals.duration
  const availableDates = useMemo(
    () => buildBookableDates(QUICK_PICK_DAYS, studioWeeklyHours),
    [studioWeeklyHours]
  )
  const bookableDateSet = useMemo(
    () =>
      new Set(
        buildBookableDates(CALENDAR_HORIZON_DAYS, studioWeeklyHours).map((d) =>
          toDateString(d)
        )
      ),
    [studioWeeklyHours]
  )
  const bookableRange = useMemo(() => {
    const dates = buildBookableDates(CALENDAR_HORIZON_DAYS, studioWeeklyHours)
    return {
      min: dates[0] ? toDateString(dates[0]) : toDateString(new Date()),
      max: dates[dates.length - 1]
        ? toDateString(dates[dates.length - 1])
        : toDateString(new Date()),
    }
  }, [studioWeeklyHours])
  const { morning: morningSlots, afternoon: afternoonSlots } = useMemo(
    () => groupSlotsByPeriod(slots),
    [slots]
  )

  useEffect(() => {
    if (selectedDate && !bookableDateSet.has(selectedDate)) {
      setSelectedDate(null)
      setSelectedSlot(null)
    }
  }, [selectedDate, bookableDateSet])

  // Al entrar a fecha/hora: preseleccionar hoy (o el primer día reservable).
  useEffect(() => {
    if (step !== 3) return
    if (selectedDate) return
    const first = availableDates[0]
    if (first) setSelectedDate(toDateString(first))
  }, [step, selectedDate, availableDates])

  const filters =
    initialFilters.length > 0 ? initialFilters : DEFAULT_FILTERS

  const availableCategories = useMemo(
    () => filters.filter((f) => f.is_active),
    [filters]
  )

  // Servicios agrupados por categoría: todas visibles, apiladas con su título.
  const servicesByCategory = useMemo(() => {
    const categorizedSlugs = new Set(availableCategories.map((c) => c.slug))
    const groups = availableCategories
      .map((cat) => ({
        slug: cat.slug,
        name: cat.name,
        services: services.filter((s) => s.filter_slug === cat.slug),
      }))
      .filter((g) => g.services.length > 0)
    const uncategorized = services.filter(
      (s) => !s.filter_slug || !categorizedSlugs.has(s.filter_slug)
    )
    if (uncategorized.length > 0) {
      groups.push({ slug: "otros", name: "Otros", services: uncategorized })
    }
    return groups
  }, [availableCategories, services])

  const scrollToCategory = useCallback((slug: string) => {
    const el = document.getElementById(`cat-${slug}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const onCategoryClick = useCallback(
    (slug: string) => {
      setActiveCategory(slug)
      categoryClickLockRef.current = true
      scrollToCategory(slug)
      window.setTimeout(() => {
        categoryClickLockRef.current = false
      }, 900)
    },
    [scrollToCategory]
  )

  // Arranca resaltando la primera categoría (p. ej. Reflexología).
  useEffect(() => {
    if (!activeCategory && servicesByCategory.length > 0) {
      setActiveCategory(servicesByCategory[0].slug)
    }
  }, [activeCategory, servicesByCategory])

  // Scroll-spy: el tab activo sigue la sección visible mientras se hace scroll.
  useEffect(() => {
    if (step !== 1) return
    const els = servicesByCategory
      .map((g) => document.getElementById(`cat-${g.slug}`))
      .filter((el): el is HTMLElement => Boolean(el))
    if (els.length === 0) return

    const visibility = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visibility.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)
        }
        if (categoryClickLockRef.current) return
        let bestId = ""
        let bestRatio = 0
        for (const [id, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }
        if (bestId) setActiveCategory(bestId.replace("cat-", ""))
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
    )
    for (const el of els) observer.observe(el)
    return () => observer.disconnect()
  }, [servicesByCategory, step])

  useEffect(() => {
    const categoria = searchParams.get("categoria")?.trim()
    const servicioId = searchParams.get("servicio")?.trim()

    if (categoria && availableCategories.some((f) => f.slug === categoria)) {
      setActiveCategory(categoria)
      window.setTimeout(() => scrollToCategory(categoria), 120)
    }

    if (!servicioId) return
    const service = services.find((s) => s.id === servicioId)
    if (!service) return

    if (service.filter_slug) {
      setActiveCategory(service.filter_slug)
      window.setTimeout(() => scrollToCategory(service.filter_slug!), 120)
    }
    setSelectedServiceIds([servicioId])
    if (service.options.length > 0) {
      setOptionsExpandedId(servicioId)
    }
  }, [searchParams, availableCategories, services, scrollToCategory])

  const selectedProfessional = professionals.find(
    (p) => p.id === selectedProfessionalId
  )

  const profLabel =
    selectedProfessionalId === "any"
      ? "cualquier profesional"
      : (selectedProfessional?.name ?? "cualquier profesional")

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(id)) {
        setSelectedOptionsByService({})
        if (optionsExpandedId === id) setOptionsExpandedId(null)
        return []
      }
      const svc = services.find((s) => s.id === id)
      setSelectedOptionsByService({})
      if (svc && svc.options.length > 0) {
        setOptionsExpandedId(id)
      } else {
        setOptionsExpandedId(null)
      }
      return [id]
    })
  }

  const handleServiceOptionsChange = (serviceId: string, optionIds: string[]) => {
    setSelectedOptionsByService({ [serviceId]: optionIds })
    setSelectedServiceIds([serviceId])
    if (optionIds.length > 0) {
      setOptionsExpandedId(serviceId)
    }
  }

  const handleServiceCardClick = (service: ServiceWithOptions) => {
    if (service.options.length > 0) {
      setOptionsExpandedId((prev) =>
        prev === service.id ? null : service.id
      )
      return
    }
    toggleService(service.id)
  }

  const serviceSelections = useMemo(
    () => buildServiceSelections(selectedServiceIds, selectedOptionsByService),
    [selectedServiceIds, selectedOptionsByService]
  )

  const servicesMissingOptions = useMemo(() => {
    const missing = new Set<string>()
    for (const id of selectedServiceIds) {
      const svc = services.find((s) => s.id === id)
      if (!svc || svc.options.length === 0) continue
      const chosen = selectedOptionsByService[id] ?? []
      if (chosen.length === 0) missing.add(id)
    }
    return missing
  }, [selectedServiceIds, selectedOptionsByService, services])

  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !selectedProfessionalId || totalDuration === 0) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    setSlotsError(null)
    try {
      const qs = new URLSearchParams({
        date: selectedDate,
        professional_id: selectedProfessionalId,
        duration_min: String(totalDuration),
      })
      const res = await fetch(`/api/appointments/availability?${qs}`)
      const json = await res.json()
      if (!res.ok || json.error) {
        setSlotsError(
          json?.error?.message ?? "No se pudieron cargar los horarios"
        )
        setSlots([])
        return
      }
      setSlots(json.data.slots ?? [])
    } catch {
      setSlotsError("Error de red al cargar horarios")
    } finally {
      setLoadingSlots(false)
    }
  }, [selectedDate, selectedProfessionalId, totalDuration])

  useEffect(() => {
    if (step === 3) fetchSlots()
  }, [step, fetchSlots])

  useEffect(() => {
    let cancelled = false

    async function loadProfilePhone() {
      if (!isAuthenticated) return

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled || !user) return

      const { data: profile } = await supabase
        .from("users")
        .select("phone")
        .eq("id", user.id)
        .single()

      if (cancelled || !profile?.phone) return

      const digits = String(profile.phone)
        .replace(/^\+52/, "")
        .replace(/\D/g, "")
      if (digits.length >= 10) {
        setPhone(digits.slice(0, 10))
      }
    }

    void loadProfilePhone()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    let cancelled = false

    const restorePendingAppointment = () => {
      if (cancelled) return

      try {
        const raw = sessionStorage.getItem("pendingAppointment")
        if (!raw) return

        const data = JSON.parse(raw) as {
          service_ids?: string[]
          service_selections?: Array<{
            service_id: string
            option_ids: string[]
          }>
          professional_id?: string | "any"
          date?: string
          start_time?: string
          client_phone?: string
        }

        if (data.service_ids?.length) {
          const serviceId = data.service_ids[0]
          setSelectedServiceIds([serviceId])
          if (data.service_selections?.length) {
            const row = data.service_selections.find(
              (s) => s.service_id === serviceId
            )
            if (row) {
              setSelectedOptionsByService({ [serviceId]: row.option_ids })
            }
          }
        } else if (data.service_selections?.length) {
          const row = data.service_selections[0]
          setSelectedServiceIds([row.service_id])
          setSelectedOptionsByService({ [row.service_id]: row.option_ids })
        }
        if (data.professional_id) {
          setSelectedProfessionalId(data.professional_id)
        }
        if (data.date) setSelectedDate(data.date)
        if (data.start_time && data.professional_id) {
          setSelectedSlot({
            start_time: data.start_time,
            end_time: "",
            professional_id:
              data.professional_id === "any" ? "" : data.professional_id,
          })
        }
        if (data.client_phone) {
          setPhone(data.client_phone.replace(/\D/g, "").slice(0, 10))
        }

        let targetStep: Step = 1
        if (data.service_ids?.length) {
          if (data.date && data.start_time && data.professional_id) {
            targetStep = 4
          } else if (data.date && data.professional_id) {
            targetStep = 3
          } else if (data.professional_id) {
            targetStep = 2
          }
        }
        setStep(targetStep)

        sessionStorage.removeItem("pendingAppointment")
      } catch {
        // noop
      }
    }

    const frameId = requestAnimationFrame(restorePendingAppointment)

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [])

  const phoneDigits = phone.replace(/\D/g, "")
  const hasValidPhone = phoneDigits.length === 10

  const canContinue =
    (step === 1 &&
      selectedServiceIds.length > 0 &&
      servicesMissingOptions.size === 0) ||
    (step === 2 &&
      selectedProfessionalId !== null &&
      eligibleProfessionals.length > 0) ||
    (step === 3 && selectedSlot !== null) ||
    (step === 4 && hasValidPhone)

  const handleContinue = () => {
    if (step === 1 && servicesMissingOptions.size > 0) {
      const firstMissing = selectedServiceIds.find((id) =>
        servicesMissingOptions.has(id)
      )
      if (firstMissing) setOptionsExpandedId(firstMissing)
      return
    }
    if (canContinue && step < 4) setStep((s) => (s + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step)
    else router.push("/servicios")
  }

  // Instantáneo (no smooth): si el scroll anima mientras llegan los
  // horarios, el sticky del resumen salta al recalcular la columna.
  const skipStepScrollRef = useRef(true)
  useEffect(() => {
    if (skipStepScrollRef.current) {
      skipStepScrollRef.current = false
      return
    }
    window.scrollTo(0, 0)
  }, [step])

  useEffect(() => {
    if (!selectedProfessionalId) return
    if (selectedProfessionalId === "any") {
      if (eligibleProfessionals.length === 0) setSelectedProfessionalId(null)
      return
    }
    const stillEligible = eligibleProfessionals.some(
      (professional) => professional.id === selectedProfessionalId
    )
    if (!stillEligible) setSelectedProfessionalId(null)
  }, [eligibleProfessionals, selectedProfessionalId])

  useEffect(() => {
    if (!proPickerOpen) return
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const node = proPickerRef.current
      if (node && !node.contains(event.target as Node)) {
        setProPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
    }
  }, [proPickerOpen])

  const hasBlockingAppointment = Boolean(
    modalAppointment &&
      (modalAppointment.status === "pending" ||
        modalAppointment.status === "paid")
  )

  const handleTransferCancelled = useCallback(() => {
    setModalAppointment(null)
    router.refresh()
  }, [router])

  const handleTransferStatusChange = useCallback(
    (status: AppointmentRecord["status"]) => {
      setModalAppointment((prev) => (prev ? { ...prev, status } : prev))
    },
    []
  )

  useEffect(() => {
    setTransferAccountNumber(initialTransferAccountNumber)
  }, [initialTransferAccountNumber])

  useEffect(() => {
    setModalAppointment(initialActiveAppointment)
  }, [initialActiveAppointment])

  const handleConfirm = async () => {
    if (!hasValidPhone) {
      setPhoneError("Ingresa tu número de celular (10 dígitos)")
      return
    }
    setPhoneError(null)

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(
          "pendingAppointment",
          JSON.stringify({
            service_ids: selectedServiceIds,
            service_selections: serviceSelections,
            professional_id: selectedProfessionalId,
            date: selectedDate,
            start_time: selectedSlot?.start_time,
            client_phone: phoneDigits,
          })
        )
      } catch {
        // noop
      }
      router.push("/login?redirect=/servicios/agendar")
      return
    }

    if (!selectedSlot || !selectedDate || !selectedProfessionalId) return
    if (hasBlockingAppointment) {
      setSubmitError("Ya tienes una cita activa. Completa o cancela tu reserva actual.")
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const profToSend =
        selectedProfessionalId === "any"
          ? "any"
          : selectedSlot.professional_id

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_ids: selectedServiceIds,
          service_selections: serviceSelections,
          professional_id: profToSend,
          date: selectedDate,
          start_time: selectedSlot.start_time,
          client_phone: phoneDigits,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setSubmitError(json?.error?.message ?? "No se pudo crear la cita")
        return
      }

      const appointmentId = json.data.appointment_id

      const activeRes = await fetch("/api/appointments/active")
      const activeJson = await activeRes.json()
      if (activeRes.ok && activeJson.data?.appointment) {
        setModalAppointment(activeJson.data.appointment)
        if (typeof activeJson.data.transfer_account_number === "string") {
          setTransferAccountNumber(activeJson.data.transfer_account_number)
        }
      } else {
        setModalAppointment((prev) =>
          prev ??
          ({
            id: appointmentId,
            user_id: null,
            professional_id: selectedSlot.professional_id,
            professional_name: selectedProfessional?.name ?? null,
            appointment_type: "individual",
            date: selectedDate,
            start_time: selectedSlot.start_time,
            end_time: selectedSlot.end_time,
            total: json.data.total,
            status: "pending",
            cancelled_by: null,
            created_at: new Date().toISOString(),
            services: selectedServices.map((s) => ({
              service_id: s.id,
              service_name: s.name,
              unit_price: s.price,
              duration_min: s.duration_min,
            })),
          } satisfies AppointmentRecord)
        )
      }

      setStep(1)
      setSelectedServiceIds([])
      setSelectedOptionsByService({})
      setSelectedProfessionalId(null)
      setSelectedDate(null)
      setSelectedSlot(null)
    } catch {
      setSubmitError("Error de red al reservar")
    } finally {
      setSubmitting(false)
    }
  }

  const summaryProps = {
    selectedServices,
    selectedOptionsByService,
    profLabel,
    selectedProfessional:
      selectedProfessionalId !== "any" ? selectedProfessional : undefined,
    selectedDate,
    selectedSlot,
    totalPrice,
    totalDuration,
    step,
    formatPrice,
    formatDuration,
    formatTimeLabel,
    prettyDate,
    getInitials,
    onContinue: handleContinue,
    onConfirm: handleConfirm,
    canContinue,
    submitting,
    clientPhone: phone,
  }

  const stickyServiceLabel =
    selectedServices.length === 0
      ? "Tu cita"
      : selectedServices.length === 1
        ? selectedServices[0].name
        : `${selectedServices.length} servicios`

  // En el paso de hora: resumen / Continuar solo con horario elegido.
  const showBookingChrome =
    selectedServiceIds.length > 0 && (step !== 3 || selectedSlot !== null)
  // Móvil paso profesional: sticky Continuar solo tras elegir profesional.
  const showStickyContinue =
    showBookingChrome && (step !== 2 || selectedProfessionalId !== null)

  return (
    <div
      className={`min-h-screen bg-ivory ${
        showStickyContinue ? "max-lg:pb-24" : ""
      }`}
    >
      {/* follow: abraza el navbar al colapsar (plain dejaba gap arriba). */}
      <header {...navSticky("follow", "z-30 bg-ivory/95 backdrop-blur-md")}>
        <div className="site-container">
          <div className="flex items-center gap-4 py-3">
            <button
              type="button"
              onClick={handleBack}
              className="shrink-0 text-[13px] font-medium text-neutral-500 transition-colors hover:text-[#0a0a0a]"
            >
              Volver
            </button>

            <div
              className="min-w-0 flex-1"
              role="status"
              aria-label={`Paso ${step} de ${TOTAL_STEPS}: ${STEP_LABELS[step]}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1" aria-hidden>
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                    const n = (i + 1) as Step
                    const filled = n <= step
                    return (
                      <span
                        key={n}
                        className={`h-0.5 flex-1 rounded-full ${
                          filled ? "bg-[#0a0a0a]" : "bg-neutral-200"
                        }`}
                      />
                    )
                  })}
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-neutral-400">
                  {step}/{TOTAL_STEPS}
                </span>
              </div>
            </div>

            <Link
              href="/servicios"
              aria-label="Cerrar"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-[#0a0a0a]"
            >
              <IconX />
            </Link>
          </div>
        </div>
      </header>

      <div className="site-container py-5 md:py-6">
        <div
          className={
            step === 4
              ? "flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:items-start"
              : "flex items-start gap-10"
          }
        >
          <div
            className={`min-w-0 flex-1 ${step === 4 ? "lg:col-span-8" : ""}`}
          >
            {/* Mismo fade+subida que app/template.tsx (lc-page-enter).
                key remonta al cambiar de paso; fill-mode none no deja
                transform que rompa sticky. */}
            <div key={step} className="lc-page-enter">
            {step === 1 && (
              <div>
                <StepHeading title="Seleccionar servicios" />

                {servicesByCategory.length > 1 && (
                  <div
                    {...navSticky(
                      "follow-below-sm",
                      "z-20 mb-6 border-b border-neutral-200/80 bg-ivory pb-3 pt-1",
                      { guard: true },
                    )}
                  >
                    <div
                      className="flex flex-wrap gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                      role="tablist"
                      aria-label="Categorías de servicio"
                    >
                      {servicesByCategory.map((group) => {
                        const active = activeCategory === group.slug
                        return (
                          <button
                            key={group.slug}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onCategoryClick(group.slug)}
                            className={`inline-flex h-9 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border px-4 text-xs font-medium uppercase tracking-wide transition-colors ${
                              active
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                            }`}
                          >
                            {group.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {servicesByCategory.length === 0 && (
                  <p className="py-8 text-center text-sm text-neutral-500">
                    No hay servicios disponibles.
                  </p>
                )}

                <div className="space-y-12">
                  {servicesByCategory.map((group) => (
                    <section
                      key={group.slug}
                      id={`cat-${group.slug}`}
                      className="scroll-mt-52"
                      aria-labelledby={`cat-${group.slug}-heading`}
                    >
                      <h2
                        id={`cat-${group.slug}-heading`}
                        className="mb-4 text-xl font-semibold tracking-[-0.01em] text-[#0a0a0a]"
                      >
                        {group.name}
                      </h2>
                      <ul className="divide-y divide-neutral-200/80 border-y border-neutral-200/80">
                        {group.services.map((s) => {
                          const selected = selectedServiceIds.includes(s.id)
                          const descExpanded = descExpandedId === s.id
                          const optionsExpanded = optionsExpandedId === s.id
                          const longDesc =
                            s.description && s.description.length > 120
                          const hasSubOptions = s.options.length > 0
                          const showSubindex = hasSubOptions && optionsExpanded
                          const missingOption = servicesMissingOptions.has(s.id)

                          return (
                            <li
                              key={s.id}
                              className={
                                missingOption
                                  ? "bg-red-50/60"
                                  : selected
                                    ? "bg-neutral-50/80"
                                    : undefined
                              }
                            >
                              <div className="flex items-start justify-between gap-3 py-5 sm:gap-6">
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleServiceCardClick(s)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault()
                                      handleServiceCardClick(s)
                                    }
                                  }}
                                  className="min-w-0 flex-1 cursor-pointer text-left"
                                >
                                  <h3 className="text-[16px] font-semibold leading-snug text-[#111]">
                                    {s.name}
                                  </h3>
                                  <p className="mt-1 text-[13px] text-[#8a8a8a]">
                                    {formatDuration(s.duration_min)}
                                  </p>
                                  {s.description && (
                                    <div
                                      className="mt-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <p
                                        className={`max-w-[52ch] text-[13px] leading-relaxed text-[#6b6b6b] ${
                                          descExpanded ? "" : "line-clamp-2"
                                        }`}
                                      >
                                        {s.description}
                                      </p>
                                      {longDesc && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDescExpandedId(
                                              descExpanded ? null : s.id,
                                            )
                                          }
                                          className="mt-1 text-[12px] font-medium text-[#111] underline decoration-neutral-400 underline-offset-4 hover:text-[#0a0a0a]"
                                        >
                                          {descExpanded
                                            ? "Ver menos"
                                            : "Ver más"}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <p className="mt-2 text-[15px] font-semibold text-[#111]">
                                    {formatPrice(s.price)}
                                  </p>
                                </div>

                                {/* + (añadir/quitar) + pestañita si hay opciones */}
                                <div
                                  className={`inline-flex h-11 shrink-0 items-stretch overflow-hidden rounded-full border transition-colors ${
                                    selected
                                      ? "border-neutral-900 bg-neutral-900 text-white"
                                      : "border-neutral-300 bg-white text-[#0a0a0a] hover:border-neutral-900"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleService(s.id)}
                                    className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${
                                      hasSubOptions ? "" : "rounded-full"
                                    } ${
                                      selected
                                        ? "hover:bg-neutral-800"
                                        : "hover:bg-neutral-50"
                                    }`}
                                    aria-label={
                                      selected
                                        ? `Quitar ${s.name}`
                                        : `Añadir ${s.name}`
                                    }
                                    aria-pressed={selected}
                                  >
                                    {selected ? (
                                      <Check
                                        className="h-4 w-4"
                                        strokeWidth={2.5}
                                        aria-hidden
                                      />
                                    ) : (
                                      <Plus
                                        className="h-4 w-4"
                                        strokeWidth={2.5}
                                        aria-hidden
                                      />
                                    )}
                                  </button>
                                  {hasSubOptions && (
                                    <>
                                      <span
                                        className={`w-px self-stretch ${
                                          selected
                                            ? "bg-white/25"
                                            : "bg-neutral-200"
                                        }`}
                                        aria-hidden
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOptionsExpandedId((prev) =>
                                            prev === s.id ? null : s.id,
                                          )
                                        }
                                        className={`inline-flex h-11 w-9 items-center justify-center transition-colors ${
                                          selected
                                            ? "hover:bg-neutral-800"
                                            : "hover:bg-neutral-50"
                                        }`}
                                        aria-label={
                                          optionsExpanded
                                            ? `Ocultar opciones de ${s.name}`
                                            : `Ver opciones de ${s.name}`
                                        }
                                        aria-expanded={optionsExpanded}
                                      >
                                        <ChevronDown
                                          className={`h-4 w-4 transition-transform duration-200 ${
                                            optionsExpanded ? "rotate-180" : ""
                                          }`}
                                          strokeWidth={2.25}
                                          aria-hidden
                                        />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {showSubindex && (
                                <div className="pb-5">
                                  <ServiceOptionsPicker
                                    serviceId={s.id}
                                    serviceName={s.name}
                                    options={s.options}
                                    selectedOptionIds={
                                      selectedOptionsByService[s.id] ?? []
                                    }
                                    onChange={handleServiceOptionsChange}
                                    variant="subindex"
                                  />
                                  {missingOption && (
                                    <p className="mt-3 text-xs font-medium text-red-600">
                                      Elige al menos una opción para continuar.
                                    </p>
                                  )}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepHeading
                  title="Seleccionar profesional"
                  subtitle="Nuestro equipo está listo para atenderte. Elige a quien prefieras o déjanos asignar según disponibilidad."
                />

                <div className="space-y-3">
                  {eligibleProfessionals.length > 0 && (
                    <div
                      className={`flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-all duration-200 ${
                        selectedProfessionalId === "any"
                          ? SELECTED_CARD
                          : DEFAULT_CARD
                      }`}
                      onClick={() => setSelectedProfessionalId("any")}
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                        <IconShuffle />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-[#0a0a0a]">
                          Sin preferencia
                        </p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                          Máxima disponibilidad
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProfessionalId("any")
                        }}
                        className={`shrink-0 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
                          selectedProfessionalId === "any"
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600 hover:border-neutral-900"
                        }`}
                      >
                        {selectedProfessionalId === "any"
                          ? "Seleccionado"
                          : "Seleccionar"}
                      </button>
                    </div>
                  )}

                  {eligibleProfessionals.length === 0 ? (
                    <p className="rounded-lg border border-neutral-200/80 bg-white p-6 text-center text-sm text-neutral-500">
                      No hay trabajadoras disponibles para los servicios
                      seleccionados. Vuelve al paso anterior y ajusta tus
                      servicios.
                    </p>
                  ) : (
                    eligibleProfessionals.map((p) => {
                      const selected = selectedProfessionalId === p.id
                      return (
                        <div
                          key={p.id}
                          className={`flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-all duration-200 ${
                            selected ? SELECTED_CARD : DEFAULT_CARD
                          }`}
                          onClick={() => setSelectedProfessionalId(p.id)}
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                            {p.photo_url ? (
                              <img
                                src={p.photo_url}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-500">
                                {getInitials(p.name)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold text-[#0a0a0a]">
                              {p.name}
                            </p>
                            {p.bio && (
                              <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                                {p.bio}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProfessionalId(p.id)
                            }}
                            className={`shrink-0 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
                              selected
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 text-neutral-600 hover:border-neutral-900"
                            }`}
                          >
                            {selected ? "Seleccionado" : "Seleccionar"}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepHeading title="Seleccionar fecha y hora" />

                {/* Feed: profesional (dropdown) + calendario */}
                <div className="mb-6 flex items-center justify-between gap-2.5">
                  <div ref={proPickerRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setProPickerOpen((v) => !v)}
                      aria-expanded={proPickerOpen}
                      aria-haspopup="listbox"
                      className="inline-flex h-11 max-w-[11.5rem] items-center gap-2 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-3 text-left transition-colors hover:border-neutral-400 sm:max-w-none"
                    >
                      {selectedProfessionalId &&
                      selectedProfessionalId !== "any" &&
                      selectedProfessional?.photo_url ? (
                        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                          <img
                            src={selectedProfessional.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </span>
                      ) : selectedProfessionalId &&
                        selectedProfessionalId !== "any" &&
                        selectedProfessional ? (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600">
                          {getInitials(selectedProfessional.name)}
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ece8f5] text-[#6b5b95]">
                          <User className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </span>
                      )}
                      <span className="truncate text-[14px] font-medium text-[#0a0a0a]">
                        {selectedProfessionalId === "any" || !selectedProfessional
                          ? "Sin preferencia"
                          : firstName(selectedProfessional.name)}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${
                          proPickerOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>

                    {proPickerOpen && (
                      <ul
                        role="listbox"
                        className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-64 min-w-[14rem] overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-1 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                      >
                        <li role="option" aria-selected={selectedProfessionalId === "any"}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProfessionalId("any")
                              setSelectedSlot(null)
                              setProPickerOpen(false)
                            }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-neutral-50 ${
                              selectedProfessionalId === "any"
                                ? "font-semibold text-[#0a0a0a]"
                                : "text-neutral-700"
                            }`}
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ece8f5] text-[#6b5b95]">
                              <User className="h-4 w-4" strokeWidth={2} aria-hidden />
                            </span>
                            Sin preferencia
                          </button>
                        </li>
                        {eligibleProfessionals.map((p) => (
                          <li
                            key={p.id}
                            role="option"
                            aria-selected={selectedProfessionalId === p.id}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProfessionalId(p.id)
                                setSelectedSlot(null)
                                setProPickerOpen(false)
                              }}
                              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-neutral-50 ${
                                selectedProfessionalId === p.id
                                  ? "font-semibold text-[#0a0a0a]"
                                  : "text-neutral-700"
                              }`}
                            >
                              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                                {p.photo_url ? (
                                  <img
                                    src={p.photo_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-neutral-500">
                                    {getInitials(p.name)}
                                  </span>
                                )}
                              </span>
                              {p.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFullCalendarOpen(true)}
                    aria-label="Ver calendario completo"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#0a0a0a] transition-colors hover:border-neutral-400"
                  >
                    <IconCalendar />
                  </button>
                </div>

                <FullCalendarModal
                  open={fullCalendarOpen}
                  onClose={() => setFullCalendarOpen(false)}
                  value={selectedDate}
                  onChange={(dateStr) => {
                    setSelectedDate(dateStr)
                    setSelectedSlot(null)
                    setFullCalendarOpen(false)
                  }}
                  availableDates={bookableDateSet}
                  minBookableDate={bookableRange.min}
                  maxBookableDate={bookableRange.max}
                />

                <div className="mb-8">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Fecha
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-color:#a3a3a3_#e5e5e5] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-200/80">
                    {availableDates.map((d) => {
                      const dateStr = toDateString(d)
                      const active = selectedDate === dateStr
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(dateStr)
                            setSelectedSlot(null)
                          }}
                          className={`flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl border transition-all duration-200 ${
                            active
                              ? "border-[#111] bg-[#111] text-white shadow-md"
                              : "border-neutral-200/80 bg-white text-[#111] hover:border-neutral-400"
                          }`}
                        >
                          <span
                            className={`text-[10px] uppercase tracking-wider ${active ? "opacity-70" : "text-neutral-500"}`}
                          >
                            {d.toLocaleDateString("es-MX", {
                              weekday: "short",
                            })}
                          </span>
                          <span className="text-lg font-bold leading-tight">
                            {d.getDate()}
                          </span>
                          <span
                            className={`text-[10px] lowercase ${active ? "opacity-70" : "text-neutral-500"}`}
                          >
                            {d.toLocaleDateString("es-MX", { month: "short" })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sin margin-bottom final: un mb aquí no colapsa (BFC) y el
                    sticky del resumen se alinea ese margen más abajo.
                    Spinner solo en la 1ª carga; al cambiar fecha se mantienen
                    los slots previos para no encoger la columna (salto sticky). */}
                <div>
                  <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Hora
                  </p>
                  {!selectedDate || (loadingSlots && slots.length === 0) ? (
                    <div className="flex min-h-[14rem] items-center gap-2 text-sm text-neutral-500">
                      <Spinner />
                      Cargando horarios…
                    </div>
                  ) : slotsError && slots.length === 0 ? (
                    <p className="text-sm text-red-600">{slotsError}</p>
                  ) : slots.length === 0 ? (
                    <div className="rounded-lg border border-neutral-200/80 bg-white px-6 py-10 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-50">
                        <IconCalendar />
                      </div>
                      <p className="text-sm font-medium text-[#111]">
                        Sin disponibilidad este día
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Prueba con otra fecha
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`space-y-8 transition-opacity duration-200 ${
                        loadingSlots ? "opacity-50" : "opacity-100"
                      }`}
                      aria-busy={loadingSlots}
                    >
                      {morningSlots.length > 0 && (
                        <div>
                          <div className="mb-4 flex items-center gap-2 text-neutral-500">
                            <IconSun morning />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                              Mañana
                            </span>
                          </div>
                          <SlotGrid
                            slots={morningSlots}
                            selectedSlot={selectedSlot}
                            onSelect={setSelectedSlot}
                            disabled={loadingSlots}
                          />
                        </div>
                      )}
                      {afternoonSlots.length > 0 && (
                        <div>
                          <div className="mb-4 flex items-center gap-2 text-neutral-500">
                            <IconSun morning={false} />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                              Tarde
                            </span>
                          </div>
                          <SlotGrid
                            slots={afternoonSlots}
                            selectedSlot={selectedSlot}
                            onSelect={setSelectedSlot}
                            disabled={loadingSlots}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Resumen + total (solo desktop; móvil usa sticky Continuar). */}
                {selectedServices.length > 0 && selectedSlot && (
                  <div className="hidden items-center justify-between gap-4 rounded-lg border border-neutral-200/80 bg-white p-6 shadow-sm lg:flex lg:flex-row">
                    <div>
                      <div className="space-y-1">
                        {selectedServices.map((s) => {
                          const opts = resolveServiceOptions(
                            s,
                            selectedOptionsByService
                          )
                          return (
                            <p key={s.id} className="font-medium text-[#111]">
                              {s.name}
                              {opts.length > 0 && (
                                <span className="ml-1 text-sm font-normal text-neutral-500">
                                  · {opts.map((o) => o.label).join(" · ")}
                                </span>
                              )}
                            </p>
                          )
                        })}
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">
                        {formatDuration(totalDuration)} con {profLabel}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                        Total
                      </p>
                      <p className="text-2xl font-semibold text-[#0a0a0a]">
                        {formatPrice(totalPrice)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <StepHeading
                  title="Revisar y confirmar"
                  subtitle="Verifica los detalles de tu cita antes de proceder al pago."
                />

                <div className="space-y-8">
                  <section>
                    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Políticas
                    </h3>
                    <div className="rounded-lg border border-neutral-200/60 bg-white p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <span className="text-[#c6a75e]">ℹ</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111]">
                            Antes de confirmar tu cita
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                            Al reservar aceptas las siguientes condiciones del
                            estudio:
                          </p>
                          <ul className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-600">
                            <li className="flex gap-3">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c6a75e]"
                                aria-hidden
                              />
                              <span>
                                <strong className="font-semibold text-[#111]">
                                  Anticipo no reembolsable.
                                </strong>{" "}
                                El anticipo de tu cita no es reembolsable una
                                vez realizado el pago.
                              </span>
                            </li>
                            <li className="flex gap-3">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c6a75e]"
                                aria-hidden
                              />
                              <span>
                                <strong className="font-semibold text-[#111]">
                                  Puntualidad.
                                </strong>{" "}
                                Te pedimos llegar a tu hora. Cuentas con{" "}
                                <strong className="font-semibold text-[#111]">
                                  10 minutos de tolerancia
                                </strong>
                                ; después de ese tiempo tu cita podrá cancelarse
                                para respetar los tiempos del resto de clientas.
                              </span>
                            </li>
                            <li className="flex gap-3">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c6a75e]"
                                aria-hidden
                              />
                              <span>
                                <strong className="font-semibold text-[#111]">
                                  Ambiente del estudio.
                                </strong>{" "}
                                Este es un momento de tranquilidad para ti. Por
                                favor no asistas con niños, para que puedas
                                disfrutar tu cita con calma.
                              </span>
                            </li>
                            <li className="flex gap-3">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c6a75e]"
                                aria-hidden
                              />
                              <span>
                                <strong className="font-semibold text-[#111]">
                                  Cancelaciones.
                                </strong>{" "}
                                Si necesitas cancelar, hazlo con al menos 24
                                horas de anticipación desde tu perfil o por
                                WhatsApp.
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Número de celular
                    </h3>
                    <div className="rounded-lg border border-neutral-200/60 bg-white p-6 md:p-8">
                      <label
                        htmlFor="booking-phone"
                        className="mb-3 block text-sm font-semibold text-[#111]"
                      >
                        Tu celular
                      </label>
                      <p className="mb-4 text-sm text-neutral-500">
                        Lo usaremos para confirmar tu cita y enviarte
                        recordatorios.
                      </p>
                      <input
                        id="booking-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                          if (phoneError) setPhoneError(null)
                        }}
                        placeholder="10 dígitos"
                        className={`w-full max-w-sm border-0 border-b bg-transparent py-3 text-sm text-[#111] outline-none placeholder:text-neutral-400 focus:border-[#c6a75e] ${
                          phoneError
                            ? "border-red-400"
                            : "border-neutral-200"
                        }`}
                      />
                      {phoneError && (
                        <p className="mt-2 text-xs text-red-600">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Personalización
                    </h3>
                    <div className="rounded-lg border border-neutral-200/60 bg-white p-6 md:p-8">
                      <label
                        htmlFor="booking-notes"
                        className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
                      >
                        ¿Algo más que debamos saber?
                      </label>
                      {showNotesInput ? (
                        <textarea
                          id="booking-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Alergias, preferencias o solicitudes especiales…"
                          rows={3}
                          className="w-full resize-none border-0 border-b border-neutral-200 bg-transparent py-3 text-sm text-[#111] outline-none placeholder:text-neutral-400 focus:border-[#c6a75e]"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm text-neutral-500">
                            Comentarios o solicitudes especiales
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowNotesInput(true)}
                            className="shrink-0 rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-[#111] transition-colors hover:border-[#111]"
                          >
                            Añadir
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {submitError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Móvil: sin card resumen; solo StickyContinueBar. */}
            </div>
          </div>

          {/* Desktop sidebar: plain (sin follow). Barras full-width del
              wizard sí usan follow para no dejar gap bajo el navbar. */}
          {step < 4 ? (
            <aside
              {...navSticky(
                "plain",
                "z-10 hidden w-[340px] shrink-0 lg:block xl:w-[380px]",
              )}
              style={{ top: "calc(var(--navbar-actual-h, 64px) + 3.75rem)" }}
            >
              <BookingSummary {...summaryProps} />
            </aside>
          ) : (
            <aside
              {...navSticky("plain", "z-10 hidden lg:col-span-4 lg:block")}
              style={{ top: "calc(var(--navbar-actual-h, 64px) + 3.75rem)" }}
            >
              <BookingSummary {...summaryProps} />
            </aside>
          )}
        </div>
      </div>

      <StickyContinueBar
        hasSelection={showStickyContinue}
        totalPrice={totalPrice}
        formatPrice={formatPrice}
        serviceLabel={stickyServiceLabel}
        onContinue={step < 4 ? handleContinue : handleConfirm}
        canContinue={canContinue}
        submitting={submitting}
        isConfirmStep={step === 4}
      />

      {modalAppointment &&
        (modalAppointment.status === "pending" ||
          modalAppointment.status === "paid") && (
          <TransferPaymentModal
            appointment={modalAppointment}
            transferAccountNumber={transferAccountNumber}
            formatPrice={formatPrice}
            formatTimeLabel={formatTimeLabel}
            prettyDate={prettyDate}
            onExpired={handleTransferCancelled}
            onStatusChange={handleTransferStatusChange}
            onCancelled={handleTransferCancelled}
            onDismiss={
              modalAppointment.status === "paid"
                ? () => setModalAppointment(null)
                : undefined
            }
          />
        )}
    </div>
  )
}
