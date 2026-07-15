"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import SmoothImage from "@/app/components/shared/SmoothImage"

import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/app/components/cart/CartContext"
import type { CartItem } from "@/lib/cart"

type Swatch = {
  id: string
  name: string
  hex: string
  productTitle?: string
  collectionLine?: string
  productLine?: string
  imageSrc?: string
  price?: number
  brand?: string | null
}

const DEMO_PRODUCT_ID = "10000000-0000-4000-8000-000000000001"

function variantIdForSwatch(swatchId: string): string {
  const tail = swatchId.padStart(12, "0").slice(-12)
  return `00000000-0000-4000-8000-${tail}`
}

const ALL_SWATCHES: Swatch[] = [
  { id: "1", name: "Alpine Snow", hex: "#F7F5F0" },
  { id: "2", name: "Bubble Bath", hex: "#ECD8CF" },
  { id: "3", name: "Funny Bunny", hex: "#EEE8E2" },
  { id: "4", name: "Put It In Neutral", hex: "#D4C4B8" },
  { id: "5", name: "Barefoot In Barcelona", hex: "#C9A08F" },
  { id: "6", name: "Tiramisu For Two", hex: "#B8897B" },
  { id: "7", name: "Chocolate Moose", hex: "#6B4A3F" },
  { id: "8", name: "Lincoln Park After Dark", hex: "#1E141C" },
  { id: "9", name: "Black Onyx", hex: "#0E0E10" },
  { id: "10", name: "Big Apple Red", hex: "#B0182A" },
  { id: "11", name: "Cajun Shrimp", hex: "#C44554" },
  { id: "12", name: "I'm Not Really A Waitress", hex: "#8E1F2A" },
  { id: "13", name: "Malaga Wine", hex: "#5C2334" },
  { id: "14", name: "Got The Blues For Red", hex: "#6B2D3C" },
  { id: "15", name: "Como Se Llama?", hex: "#A84850" },
  { id: "16", name: "Coral-ing Your Spirit Animal", hex: "#E06C5E" },
  { id: "17", name: "Sunset Orange", hex: "#E35B26" },
  { id: "18", name: "Atomic Orange", hex: "#E85D04" },
  { id: "19", name: "Exotic Birds Do Not Tweet", hex: "#F4B942" },
  { id: "20", name: "Never A Dulles Moment", hex: "#E8C547" },
  { id: "21", name: "Do You Lilac It?", hex: "#C5B4E3" },
  { id: "22", name: "You're Such A Budapest", hex: "#B8A6D9" },
  { id: "23", name: "Lost My Bikini In Molokini", hex: "#6FA8BC" },
  { id: "24", name: "No Room For The Blues", hex: "#4A7BA7" },
  {
    id: "25",
    name: "Russian Navy",
    hex: "#2E3A56",
    productTitle: "ARTEMIS",
    collectionLine: "COLECCIÓN OLIMPO",
    productLine: "Esmalte azul marino con acabado metalizado.",
    imageSrc: "/images/shop-colors/artemis.png",
    price: 189,
    brand: "Olimpo",
  },
  { id: "26", name: "Sapphire Blue", hex: "#1E3D59" },
  { id: "27", name: "Amazon Amaz-off", hex: "#2D6A4F" },
  { id: "28", name: "Jade Is The New Black", hex: "#3D6B5B" },
  { id: "29", name: "Strawberry Margarita", hex: "#E84D6F" },
  { id: "30", name: "La Paz-itively Hot", hex: "#E04F6F" },
  { id: "31", name: "That's Hula-rious!", hex: "#E8DAB2" },
  { id: "32", name: "Don't Bossa Nova Me Around", hex: "#C9B8A8" },
  { id: "33", name: "Champagne Bubble Bath", hex: "#E8D9CE" },
  { id: "34", name: "Baby Take A Vow", hex: "#D8C8BE" },
  { id: "35", name: "Sweetheart", hex: "#E8B4B8" },
  { id: "36", name: "Dim Sum Plum", hex: "#6B4E60" },
]

function pick(...ids: string[]): Swatch[] {
  return ids.map((id) => ALL_SWATCHES.find((s) => s.id === id)!).filter(Boolean)
}

const PALETTES = [
  {
    id: "primarios",
    label: "Primarios",
    swatches: pick("10", "11", "16", "17", "18", "19", "20", "29", "30", "23", "24", "27", "28"),
  },
  {
    id: "neutros",
    label: "Neutros",
    swatches: pick("1", "3", "2", "33", "31", "34", "32", "4", "5", "6", "7"),
  },
  {
    id: "rosas",
    label: "Rosas & Lilas",
    swatches: pick("35", "15", "29", "30", "11", "21", "22", "36"),
  },
  {
    id: "oscuros",
    label: "Oscuros",
    swatches: pick("12", "13", "14", "36", "25", "26", "24", "8", "9", "7", "27", "28"),
  },
  {
    id: "todos",
    label: "Todos",
    swatches: ALL_SWATCHES,
  },
]

function textToneForHex(hex: string): "light" | "dark" {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.55 ? "dark" : "light"
}

export default function ShopByNailPolishColors() {
  const { addItem, openCart } = useCart()
  const [openId, setOpenId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activePalette, setActivePalette] = useState("primarios")
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect() } },
      { threshold: 0.08 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(Boolean(user))
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(Boolean(session?.user))
    })
    return () => subscription.unsubscribe()
  }, [])

  const currentSwatches =
    PALETTES.find((p) => p.id === activePalette)?.swatches ?? ALL_SWATCHES

  const selected = openId
    ? ALL_SWATCHES.find((s) => s.id === openId) ?? null
    : null

  const closeModal = useCallback(() => setOpenId(null), [])

  const handlePaletteChange = useCallback((id: string) => {
    setActivePalette(id)
    setOpenId(null)
  }, [])

  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openId, closeModal])

  const handleAddToCart = useCallback(async () => {
    if (!selected) return
    if (isLoggedIn) {
      window.location.assign("/tienda?categoria=esmaltes-colores")
      closeModal()
      return
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : ""
    const displayName = selected.productTitle ?? selected.name
    const item: CartItem = {
      productId: DEMO_PRODUCT_ID,
      variantId: variantIdForSwatch(selected.id),
      quantity: 1,
      price: selected.price ?? 120,
      name: displayName,
      brand: selected.brand ?? null,
      image:
        selected.imageSrc && origin
          ? `${origin}${selected.imageSrc}`
          : null,
    }
    await addItem(item)
    openCart()
    closeModal()
  }, [addItem, closeModal, isLoggedIn, openCart, selected])

  return (
    <section ref={sectionRef} className="bg-white pt-14 text-black">
      <style>{`
        @keyframes paletteIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .palette-enter { animation: paletteIn 280ms ease both; }
      `}</style>

      <div>
        <header
          className={`mb-10 max-w-[720px] transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        >
          <h2 className="mb-[18px] mt-3.5 font-[family-name:var(--font-playfair),serif] text-[clamp(36px,4.4vw,56px)] font-medium leading-[1.05] tracking-[-0.01em] text-black">
            Compra por Color de{" "}
            <em className="font-medium italic text-[#a8862f]">
              Esmalte
            </em>
          </h2>
          <div
            className="mb-[18px] h-0.5 w-16 rounded-sm bg-[#c9a84c]"
            aria-hidden
          />
          <p className="max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
            Explora nuestra paleta completa y encuentra el tono perfecto para cada ocasión — desde neutros elegantes hasta colores vibrantes.
          </p>
        </header>

        <div
          className={`w-full transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "180ms" }}
        >
          {/* Palette selector — top right */}
          <div className="mb-3 flex flex-wrap items-center justify-end gap-1">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePaletteChange(p.id)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
                  activePalette === p.id
                    ? "bg-[#111] text-white"
                    : "text-[#8a8a8a] hover:text-[#111]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Swatch grid — key forces remount + fade on palette change */}
          <div
            key={activePalette}
            className="palette-enter grid w-full grid-cols-9 gap-1.5 sm:gap-2"
            role="list"
            aria-label="Paleta de esmaltes"
          >
            {currentSwatches.map((swatch) => (
              <div
                key={swatch.id}
                className="relative aspect-square min-w-0 overflow-visible"
                role="listitem"
              >
                <div className="group relative h-full w-full">
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 max-w-[min(160px,40vw)] -translate-x-1/2 translate-y-1 whitespace-normal rounded-md bg-white/95 px-2 py-1 text-center text-[10px] font-medium leading-snug text-neutral-900 opacity-0 shadow-md ring-1 ring-black/10 transition-[opacity,transform] duration-200 ease-out group-hover:-translate-y-0 group-hover:opacity-100"
                    aria-hidden
                  >
                    {swatch.name}
                  </span>
                  <button
                    type="button"
                    className="relative z-0 h-full w-full overflow-hidden rounded-sm border border-neutral-200/80 shadow-sm transition-[transform,box-shadow,filter] duration-200 ease-out hover:z-20 hover:shadow-lg focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] group-hover:scale-[1.04] group-hover:ring-2 group-hover:ring-black/35 group-hover:brightness-[1.07]"
                    style={{ backgroundColor: swatch.hex }}
                    aria-label={swatch.name}
                    aria-haspopup="dialog"
                    aria-expanded={openId === swatch.id}
                    onClick={() => setOpenId(swatch.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-color-dialog-title"
            className={`relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10 transition-opacity duration-200 ${
              textToneForHex(selected.hex) === "light"
                ? "text-neutral-900"
                : "text-white"
            }`}
            style={{ backgroundColor: selected.hex }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                textToneForHex(selected.hex) === "light"
                  ? "bg-black/10 hover:bg-black/15"
                  : "bg-white/15 hover:bg-white/25"
              }`}
              aria-label="Cerrar"
              onClick={closeModal}
            >
              <span className="text-lg leading-none" aria-hidden>
                ×
              </span>
            </button>

            <div className="px-6 pb-6 pt-10">
              {selected.imageSrc ? (
                <div className="relative mx-auto mb-4 aspect-[3/4] w-full max-w-[220px]">
                  <SmoothImage
                    src={selected.imageSrc}
                    alt={selected.productTitle ?? selected.name}
                    fill
                    className="object-contain drop-shadow-md"
                    sizes="220px"
                    priority
                  />
                </div>
              ) : (
                <div
                  className="mx-auto mb-6 h-40 w-full max-w-[200px] rounded-xl shadow-inner ring-1 ring-black/10"
                  style={{ backgroundColor: selected.hex }}
                  aria-hidden
                />
              )}

              <h3
                id="shop-color-dialog-title"
                className="text-center font-sans text-lg font-semibold tracking-tight"
              >
                {selected.productTitle ?? selected.name}
              </h3>
              {selected.collectionLine ? (
                <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.2em] opacity-90">
                  {selected.collectionLine}
                </p>
              ) : null}
              {selected.productLine ? (
                <p className="mt-3 text-center text-sm leading-snug opacity-95">
                  {selected.productLine}
                </p>
              ) : null}

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="rounded-full bg-neutral-900 px-8 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-md transition hover:bg-neutral-800"
                  onClick={handleAddToCart}
                >
                  {isLoggedIn ? "Ver en tienda" : "Agregar a la bolsa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
