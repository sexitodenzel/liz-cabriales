"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

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
  const [hover, setHover] = useState(false)
  const isVideo = post.media_type === "VIDEO"
  const imgSrc = isVideo ? (post.thumbnail_url ?? post.media_url) : post.media_url

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative block overflow-hidden bg-neutral-100"
      style={{ aspectRatio: "4 / 5" }}
      aria-label={post.caption ?? "Post de Instagram"}
    >
      <Image
        src={imgSrc}
        alt={post.caption ?? ""}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover"
        loading="lazy"
      />

      {isVideo && (
        <span
          className="absolute top-3 right-3 z-10 text-white/95"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}
        >
          <VideoIcon />
        </span>
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{ background: "rgba(0,0,0,0.55)", opacity: hover ? 1 : 0 }}
      />

      {/* Caption */}
      {post.caption && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 p-5 text-white transition-all duration-300 ease-out"
          style={{
            opacity: hover ? 1 : 0,
            transform: hover ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-cormorant-garamond), serif",
              fontWeight: 300,
              fontSize: "15px",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
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
      className="animate-pulse bg-neutral-200"
      style={{ aspectRatio: "4 / 5" }}
    />
  )
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [arrowHover, setArrowHover] = useState(false)

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

  const isEmpty = !loading && posts.length === 0

  return (
    <section
      className="bg-white site-container pb-24 pt-12"
      style={{ color: "#1a1a18" }}
    >
      {/* Eyebrow */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="block w-12 h-px" style={{ background: "#b8922e" }} />
        <span
          className="uppercase font-light"
          style={{
            fontSize: 11,
            letterSpacing: "0.32em",
            fontFamily: "var(--font-cormorant-garamond), serif",
          }}
        >
          Academia Liz Cabriales
        </span>
        <span className="block w-12 h-px" style={{ background: "#b8922e" }} />
      </div>

      {/* Title */}
      <div className="relative max-w-6xl mx-auto mb-3">
        <h2
          className="text-center leading-none"
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontWeight: 700,
            fontSize: "clamp(48px, 7vw, 96px)",
            letterSpacing: "-0.02em",
            color: "#1a1a18",
          }}
        >
          #lizcabriales
        </h2>
      </div>

      {/* Subtext */}
      <p
        className="text-center font-light tracking-wide mb-14"
        style={{ fontSize: 15, color: "#737373" }}
      >
        Síguenos en{" "}
        <a
          href="https://www.instagram.com/liz_cabriales/"
          target="_blank"
          rel="noopener noreferrer"
          className="italic transition-colors duration-300"
          style={{
            color: "#1a1a18",
            borderBottom: "0.5px solid rgba(184,146,46,0.5)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#b8922e"
            e.currentTarget.style.borderBottomColor = "#b8922e"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#1a1a18"
            e.currentTarget.style.borderBottomColor = "rgba(184,146,46,0.5)"
          }}
        >
          @liz_cabriales
        </a>
      </p>

      {/* Grid + arrow */}
      {!isEmpty && (
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 2 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
              : posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>

          {!loading && (
            <a
              href="https://www.instagram.com/liz_cabriales/"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setArrowHover(true)}
              onMouseLeave={() => setArrowHover(false)}
              aria-label="Ver más en Instagram"
              className="hidden md:flex absolute items-center justify-center"
              style={{
                right: -56,
                top: "50%",
                transform: "translateY(-50%)",
                width: 40,
                height: 40,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke={arrowHover ? "#b8922e" : "#1a1a18"}
                strokeWidth="0.5"
                style={{ transition: "stroke 0.3s ease" }}
                aria-hidden="true"
              >
                <path d="M7 4 L15 11 L7 18" strokeLinecap="square" />
              </svg>
            </a>
          )}
        </div>
      )}
    </section>
  )
}
