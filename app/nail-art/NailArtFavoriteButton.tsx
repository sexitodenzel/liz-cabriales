"use client"

import { Star } from "lucide-react"
import { useNailArtFavorites } from "@/app/components/wishlist/NailArtFavoritesContext"
import { useState } from "react"

type Props = {
  postId: string
}

export default function NailArtFavoriteButton({ postId }: Props) {
  const { has, toggle, hydrated } = useNailArtFavorites()
  const [burst, setBurst] = useState(false)
  const favorited = hydrated ? has(postId) : false

  function onToggle() {
    const next = toggle(postId)
    if (next) {
      setBurst(true)
      window.setTimeout(() => setBurst(false), 520)
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex items-center gap-2 text-[14px] transition-opacity hover:opacity-70 ${
        favorited ? "text-[#c6a75e]" : "text-[#111]"
      }`}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorited}
    >
      <Star
        className={`h-6 w-6 transition-transform ${
          favorited ? "fill-[#c6a75e] text-[#c6a75e]" : ""
        } ${burst ? "animate-pulse scale-125" : ""}`}
        strokeWidth={1.6}
      />
      {burst && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          <Star className="h-12 w-12 fill-[#c6a75e] text-[#c6a75e] animate-ping opacity-80" />
        </span>
      )}
    </button>
  )
}
