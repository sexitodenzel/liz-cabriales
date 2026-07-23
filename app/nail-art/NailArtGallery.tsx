"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import type { NailArtPost } from "@/lib/supabase/nail-art"
import { useNailArtFavorites } from "@/app/components/wishlist/NailArtFavoritesContext"
import NailArtSubmitForm from "./NailArtSubmitForm"
import NailArtCard from "./NailArtCard"

export type NailArtFilter = "featured" | "likes" | "recent" | "editorial" | "favorites"

const FILTER_OPTIONS: { value: NailArtFilter; label: string }[] = [
  { value: "featured", label: "Destacados" },
  { value: "editorial", label: "Elaborado por nosotros" },
  { value: "likes", label: "Con más me gusta" },
  { value: "recent", label: "Recientes" },
  { value: "favorites", label: "Favoritos" },
]

type Props = {
  posts: NailArtPost[]
  isLoggedIn: boolean
  likedIds: string[]
}

function sortPosts(posts: NailArtPost[], filter: NailArtFilter): NailArtPost[] {
  const list = [...posts]
  if (filter === "likes") {
    return list.sort(
      (a, b) =>
        b.likes_count - a.likes_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }
  if (filter === "recent") {
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }
  return list.sort((a, b) => {
    if (a.is_editorial !== b.is_editorial) return a.is_editorial ? -1 : 1
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function NailArtFilterDropdown({
  value,
  onChange,
}: {
  value: NailArtFilter
  onChange: (value: NailArtFilter) => void
}) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = FILTER_OPTIONS.find((o) => o.value === value) ?? FILTER_OPTIONS[0]

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block min-w-[11.5rem] sm:min-w-[12.5rem]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filtrar publicaciones"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 w-full items-center justify-between gap-3 rounded-full border bg-white px-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111] outline-none transition-all duration-200 sm:text-[12px] sm:normal-case sm:tracking-normal sm:font-medium ${
          open
            ? "border-[#c6a75e] shadow-[0_0_0_3px_rgba(198,167,94,0.15)]"
            : "border-neutral-300 hover:border-neutral-500"
        }`}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-300 ease-out ${
            open ? "rotate-180 text-[#c6a75e]" : ""
          }`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      <div
        className={`absolute right-0 z-30 mt-2 w-[min(100vw-2rem,16rem)] origin-top transition-[opacity,transform] duration-200 ease-out sm:w-full ${
          open
            ? visible
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-1 scale-[0.98] opacity-0"
            : "pointer-events-none -translate-y-1 scale-[0.96] opacity-0"
        }`}
        role="presentation"
      >
        <ul
          role="listbox"
          aria-label="Opciones de filtro"
          className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
        >
          {FILTER_OPTIONS.map((opt) => {
            const isActive = opt.value === value
            return (
              <li key={opt.value} role="option" aria-selected={isActive} className="px-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition-colors duration-150 ${
                    isActive
                      ? "bg-[#f7f1e4] font-semibold text-[#8a6d26]"
                      : "font-medium text-[#222] hover:bg-neutral-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isActive && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#c6a75e]" strokeWidth={2.25} />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default function NailArtGallery({ posts, isLoggedIn, likedIds }: Props) {
  const [filter, setFilter] = useState<NailArtFilter>("featured")
  const { has: hasFavorite, hydrated } = useNailArtFavorites()
  const likedSet = useMemo(() => new Set(likedIds), [likedIds])

  const visible = useMemo(() => {
    if (filter === "favorites") {
      if (!hydrated) return []
      return sortPosts(
        posts.filter((p) => hasFavorite(p.id)),
        "recent"
      )
    }
    if (filter === "editorial") {
      return sortPosts(
        posts.filter((p) => p.is_editorial),
        "recent"
      )
    }
    return sortPosts(posts, filter)
  }, [posts, filter, hasFavorite, hydrated])

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(28px,4vw,42px)] font-medium leading-none text-[#111]">
            Nail Art
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            Inspírate con diseños hechos por productos de nuestro catálogo
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <NailArtFilterDropdown value={filter} onChange={setFilter} />
          <NailArtSubmitForm isLoggedIn={isLoggedIn} />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-[14px] text-neutral-500">
          {filter === "favorites"
            ? "Aún no tienes favoritos. Marca una estrella en cualquier diseño."
            : filter === "editorial"
              ? "Aún no hay diseños elaborados por el estudio."
              : "Aún no hay diseños publicados. ¡Sé la primera en inspirar!"}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((post) => (
            <li key={post.id}>
              <NailArtCard
                post={post}
                isLoggedIn={isLoggedIn}
                initialLiked={likedSet.has(post.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
