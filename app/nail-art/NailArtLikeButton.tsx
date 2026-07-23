"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"

type Props = {
  postId: string
  initialCount: number
  initialLiked: boolean
  isLoggedIn: boolean
}

export default function NailArtLikeButton({
  postId,
  initialCount,
  initialLiked,
  isLoggedIn,
}: Props) {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (busy) return
    setBusy(true)
    const prevLiked = liked
    const prevCount = count
    setLiked(!prevLiked)
    setCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1)
    try {
      const res = await fetch("/api/nail-art/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
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
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      className="inline-flex items-center gap-2 text-[14px] text-[#111] transition-opacity hover:opacity-70 disabled:opacity-50"
      aria-label={liked ? "Quitar like" : "Dar like"}
      aria-pressed={liked}
    >
      <Heart
        className={`h-6 w-6 ${liked ? "fill-neutral-900 text-neutral-900" : ""}`}
        strokeWidth={1.6}
      />
      <span className="font-medium tabular-nums">{count}</span>
    </button>
  )
}
