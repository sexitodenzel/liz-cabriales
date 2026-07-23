"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Star } from "lucide-react"
import SmoothImage from "@/app/components/shared/SmoothImage"
import { useNailArtFavorites } from "@/app/components/wishlist/NailArtFavoritesContext"
import { nailArtImageApiPath } from "@/lib/nail-art-image"
import type { NailArtPost } from "@/lib/supabase/nail-art"

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return ""
  }
}

type Props = {
  post: NailArtPost
  isLoggedIn: boolean
  initialLiked: boolean
  onFavoriteChange?: (postId: string, favorited: boolean) => void
}

export default function NailArtCard({
  post,
  isLoggedIn,
  initialLiked,
  onFavoriteChange,
}: Props) {
  const router = useRouter()
  const { has: hasFavorite, toggle: toggleFavoriteId, hydrated } = useNailArtFavorites()
  const coverImage = nailArtImageApiPath(post.id)
  const author = post.author_display_name || (post.is_editorial ? "Liz Cabriales" : "Usuario")
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(post.likes_count)
  const [busyLike, setBusyLike] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)
  const [starBurst, setStarBurst] = useState(false)
  const likeLock = useRef(false)

  const favorited = hydrated ? hasFavorite(post.id) : false

  function requireAuth() {
    router.push(`/login?next=${encodeURIComponent("/nail-art")}`)
  }

  async function toggleLike(e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    if (!isLoggedIn) {
      requireAuth()
      return
    }
    if (likeLock.current || busyLike) return
    likeLock.current = true
    setBusyLike(true)
    const prevLiked = liked
    const prevCount = count
    const nextLiked = !prevLiked
    setLiked(nextLiked)
    setCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1)
    if (nextLiked) {
      setHeartBurst(true)
      window.setTimeout(() => setHeartBurst(false), 520)
    }
    try {
      const res = await fetch("/api/nail-art/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      })
      const body = await res.json()
      if (!res.ok || body.error) {
        setLiked(prevLiked)
        setCount(prevCount)
        return
      }
      setLiked(Boolean(body.data?.liked))
      setCount(Number(body.data?.likes_count ?? 0))
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setBusyLike(false)
      likeLock.current = false
    }
  }

  function toggleFavorite(e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    const next = toggleFavoriteId(post.id)
    onFavoriteChange?.(post.id, next)
    if (next) {
      setStarBurst(true)
      window.setTimeout(() => setStarBurst(false), 520)
    }
  }

  function onDoubleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!liked) void toggleLike()
    else {
      setHeartBurst(true)
      window.setTimeout(() => setHeartBurst(false), 520)
    }
  }

  const showActions = liked || favorited

  return (
    <article className="group flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-2xl bg-neutral-100"
        style={{ aspectRatio: "3/4" }}
        onDoubleClick={onDoubleClick}
      >
        <Link href={`/nail-art/${post.slug}`} className="absolute inset-0 z-0 block">
          <SmoothImage
            src={coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {post.is_editorial && (
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a6d26] shadow-sm">
            Elaborado por Nosotros
          </span>
        )}

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-3 pb-3 pt-16 transition-opacity duration-300 ${
            showActions
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          }`}
        >
          <div className="pointer-events-auto flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-pressed={favorited}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-200 active:scale-90 ${
                favorited
                  ? "bg-white text-[#c6a75e] shadow-md"
                  : "bg-white/90 text-[#111] hover:bg-white hover:scale-105"
              }`}
            >
              <Star
                className={`h-5 w-5 transition-transform ${
                  favorited ? "fill-[#c6a75e] text-[#c6a75e] scale-110" : ""
                } ${starBurst ? "animate-pulse scale-125" : ""}`}
                strokeWidth={1.75}
              />
            </button>
            <button
              type="button"
              onClick={(e) => void toggleLike(e)}
              disabled={busyLike}
              aria-label={liked ? "Quitar like" : "Dar like"}
              aria-pressed={liked}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-200 active:scale-90 ${
                liked
                  ? "bg-white text-[#111] shadow-md"
                  : "bg-white/90 text-[#111] hover:bg-white hover:scale-105"
              }`}
            >
              <Heart
                className={`h-5 w-5 transition-transform ${
                  liked ? "fill-current scale-110" : ""
                } ${heartBurst ? "animate-pulse scale-125" : ""}`}
                strokeWidth={1.75}
              />
            </button>
          </div>
        </div>

        {heartBurst && (
          <span
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            aria-hidden
          >
            <Heart className="h-16 w-16 fill-white text-white drop-shadow-lg animate-ping opacity-80" />
          </span>
        )}
        {starBurst && (
          <span
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            aria-hidden
          >
            <Star className="h-16 w-16 fill-[#c6a75e] text-[#c6a75e] drop-shadow-lg animate-ping opacity-90" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <Link
          href={`/nail-art/${post.slug}`}
          className="truncate text-[13px] font-medium text-[#111] transition-colors hover:text-[#a8862f]"
        >
          {author}
        </Link>
        <div className="flex items-center justify-between gap-2 text-[12px] text-neutral-500">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleFavorite}
              className={`inline-flex items-center transition-colors ${
                favorited ? "text-[#c6a75e]" : "hover:text-[#111]"
              }`}
              aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Star
                className={`h-3.5 w-3.5 ${favorited ? "fill-[#c6a75e] text-[#c6a75e]" : ""}`}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={(e) => void toggleLike(e)}
              disabled={busyLike}
              className={`inline-flex items-center gap-1 tabular-nums transition-colors ${
                liked ? "text-[#111]" : "hover:text-[#111]"
              }`}
              aria-label={liked ? "Quitar like" : "Dar like"}
            >
              <Heart
                className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}
                strokeWidth={1.75}
                aria-hidden
              />
              {count}
            </button>
          </div>
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        </div>
      </div>
    </article>
  )
}
