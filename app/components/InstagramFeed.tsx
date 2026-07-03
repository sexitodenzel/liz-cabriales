"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

const INSTAGRAM_URL = "https://www.instagram.com/liz_cabriales/"

type MediaType = "IMAGE" | "VIDEO"

interface InstagramPost {
  id: string
  media_url: string
  thumbnail_url: string | null
  permalink: string
  caption: string | null
  media_type: MediaType
  timestamp: string
}

type ApiResponse =
  | { data: InstagramPost[]; error: null }
  | { data: null; error: { message: string; code?: string } }

/* Fallback si la API de Instagram no devuelve posts: la sección de cierre
   no puede quedar vacía. Placeholders hasta tener fotos propias. */
const PLACEHOLDER_POSTS: InstagramPost[] = [
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=75",
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=75",
  "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=75",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=75",
].map((url, i) => ({
  id: `placeholder-${i}`,
  media_url: url,
  thumbnail_url: null,
  permalink: INSTAGRAM_URL,
  caption: null,
  media_type: "IMAGE" as const,
  timestamp: "",
}))

function VideoIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="13" height="12" rx="0.5" />
      <path d="M16 10 L21 7 L21 17 L16 14 Z" />
    </svg>
  )
}

function PostCard({ post }: { post: InstagramPost }) {
  const isVideo = post.media_type === "VIDEO"
  const imgSrc = isVideo ? (post.thumbnail_url ?? post.media_url) : post.media_url

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-card bg-neutral-100"
      style={{ aspectRatio: "4 / 5" }}
      aria-label={post.caption ?? "Post de Instagram"}
    >
      <Image
        src={imgSrc}
        alt={post.caption ?? ""}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        loading="lazy"
      />

      {isVideo && (
        <span className="absolute right-3 top-3 z-10 text-white/95 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.4))]">
          <VideoIcon />
        </span>
      )}

      <div className="absolute inset-0 bg-black/55 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />

      {post.caption && (
        <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-2 p-5 text-white opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <p className="overflow-hidden font-display text-[15px] italic leading-[1.4] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box]">
            {post.caption}
          </p>
        </div>
      )}
    </a>
  )
}

function PostSkeleton() {
  return (
    <div
      className="animate-pulse rounded-card bg-neutral-200"
      style={{ aspectRatio: "4 / 5" }}
    />
  )
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/instagram")
      .then((res) => res.json() as Promise<ApiResponse>)
      .then((json) => {
        if (json.data) setPosts(json.data.slice(0, 4))
      })
      .catch(() => {
        // error silencioso
      })
      .finally(() => setLoading(false))
  }, [])

  const items = !loading && posts.length === 0 ? PLACEHOLDER_POSTS : posts

  return (
    <section className="site-container pb-24 pt-12 text-ink" aria-labelledby="home-instagram-title">
      {/* Eyebrow */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="block h-px w-12 bg-gold-soft" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
          Academia Liz Cabriales
        </span>
        <span className="block h-px w-12 bg-gold-soft" aria-hidden />
      </div>

      {/* Title */}
      <h2
        id="home-instagram-title"
        className="text-center font-display text-[clamp(44px,6.5vw,88px)] font-medium leading-none tracking-[-0.02em] text-ink"
      >
        #lizcabriales
      </h2>

      {/* Subtext */}
      <p className="mb-14 mt-3 text-center text-[15px] text-ink-soft">
        Síguenos en{" "}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-gold-soft/50 italic text-ink transition-colors duration-300 hover:border-gold hover:text-gold"
        >
          @liz_cabriales
        </a>
      </p>

      {/* Grid + arrow */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
            : items.map((post) => <PostCard key={post.id} post={post} />)}
        </div>

        {!loading && (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver más en Instagram"
            className="absolute -right-14 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center text-ink transition-colors duration-300 hover:text-gold min-[1712px]:flex"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              aria-hidden="true"
            >
              <path d="M7 4 L15 11 L7 18" strokeLinecap="square" />
            </svg>
          </a>
        )}
      </div>
    </section>
  )
}
