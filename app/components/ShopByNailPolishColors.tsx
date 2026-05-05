"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/app/components/cart/CartContext"
import type { CartItem } from "@/lib/cart"

type Swatch = {
  id: string
  name: string
  hex: string
  /** En el modal: título del producto (p. ej. ARTEMIS). Si existe, no se muestra el nombre del shade como título duplicado. */
  productTitle?: string
  collectionLine?: string
  productLine?: string
  imageSrc?: string
  /** Precio demo para “Añadir al carrito” (invitados). */
  price?: number
  brand?: string | null
}

/** Producto demo único; variante distinta por swatch (UUID válidos para el carrito). */
const DEMO_PRODUCT_ID = "10000000-0000-4000-8000-000000000001"

function variantIdForSwatch(swatchId: string): string {
  const tail = swatchId.padStart(12, "0").slice(-12)
  return `00000000-0000-4000-8000-${tail}`
}

const NAIL_POLISH_SWATCHES: Swatch[] = [
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

  const selected = openId
    ? NAIL_POLISH_SWATCHES.find((s) => s.id === openId) ?? null
    : null

  const closeModal = useCallback(() => setOpenId(null), [])

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
    <section className="bg-white py-14 text-black">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500">
            Colección
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-cormorant-garamond),Georgia,serif] text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-neutral-900">
            Shop By Nail Polish Colors
          </h2>
        </div>

        <div className="w-full">
          <div
            className="grid w-full grid-cols-9 gap-1.5 sm:gap-2"
            role="list"
            aria-label="Paleta de esmaltes"
          >
            {NAIL_POLISH_SWATCHES.map((swatch) => (
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
                  <Image
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
                  {isLoggedIn ? "Ver en tienda" : "Añadir al carrito"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
