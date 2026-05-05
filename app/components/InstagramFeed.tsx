"use client"

import { useState } from "react"
import Image from "next/image"

type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"

interface InstagramPost {
  id: string
  media_url: string
  permalink: string
  like_count: number
  comments_count: number
  caption: string
  media_type: MediaType
  timestamp: string
}

// To connect real Instagram: replace this array with a fetch from /api/instagram.
// That route handler should call the Instagram Graph API with the token stored in
// IG_ACCESS_TOKEN. Required fields:
//   id,media_url,permalink,like_count,comments_count,caption,media_type,timestamp
// Note: like_count and comments_count require a Business or Creator account.
// Long-lived tokens expire in 60 days — configure a refresh cron accordingly.
const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: "1",
    media_url:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
    permalink: "https://www.instagram.com/liz_cabriales/",
    like_count: 1284,
    comments_count: 47,
    caption:
      "French clásico con un giro contemporáneo. Curso intensivo de técnicas de extensión con acrílico.",
    media_type: "IMAGE",
    timestamp: "2026-04-28T10:00:00Z",
  },
  {
    id: "2",
    media_url:
      "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&q=80",
    permalink: "https://www.instagram.com/liz_cabriales/",
    like_count: 2156,
    comments_count: 89,
    caption:
      "Behind the scenes del workshop de nail art editorial. Próxima edición en CDMX.",
    media_type: "VIDEO",
    timestamp: "2026-04-25T14:30:00Z",
  },
  {
    id: "3",
    media_url:
      "https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=800&q=80",
    permalink: "https://www.instagram.com/liz_cabriales/",
    like_count: 942,
    comments_count: 31,
    caption:
      "Estructura perfecta es la base de todo. Módulo 02 — Anatomía de la uña natural.",
    media_type: "IMAGE",
    timestamp: "2026-04-22T09:15:00Z",
  },
  {
    id: "4",
    media_url:
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&q=80",
    permalink: "https://www.instagram.com/liz_cabriales/",
    like_count: 3421,
    comments_count: 156,
    caption:
      "Colección cápsula otoño · Tonos profundos y acabados satinados. Disponible en la academia.",
    media_type: "CAROUSEL_ALBUM",
    timestamp: "2026-04-20T16:45:00Z",
  },
]

function formatCount(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n)
}

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

function CarouselIcon() {
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
      <rect x="6" y="3" width="15" height="15" rx="0.5" />
      <rect x="3" y="6" width="15" height="15" rx="0.5" />
    </svg>
  )
}

function PostCard({ post }: { post: InstagramPost }) {
  const [hover, setHover] = useState(false)
  const isMulti =
    post.media_type === "VIDEO" || post.media_type === "CAROUSEL_ALBUM"

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative block overflow-hidden bg-neutral-100"
      style={{ aspectRatio: "4 / 5" }}
      aria-label={post.caption}
    >
      <Image
        src={post.media_url}
        alt={post.caption}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover"
        loading="lazy"
      />

      {isMulti && (
        <span
          className="absolute top-3 right-3 z-10 text-white/95"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}
        >
          {post.media_type === "VIDEO" ? <VideoIcon /> : <CarouselIcon />}
        </span>
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{ background: "rgba(0,0,0,0.55)", opacity: hover ? 1 : 0 }}
      />

      {/* Likes + comments */}
      <div
        className="absolute top-4 left-4 z-10 flex items-center gap-4 text-white transition-all duration-300 ease-out"
        style={{
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(-4px)",
          fontSize: "13px",
          fontWeight: 300,
          letterSpacing: "0.04em",
        }}
      >
        <span className="flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
          </svg>
          {formatCount(post.like_count)}
        </span>
        <span className="flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0z" />
          </svg>
          {formatCount(post.comments_count)}
        </span>
      </div>

      {/* Caption */}
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
    </a>
  )
}

export default function InstagramFeed() {
  const [arrowHover, setArrowHover] = useState(false)

  return (
    <section
      className="bg-white px-6 pb-24 pt-12 md:px-12"
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
      <div className="relative max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 2 }}>
          {INSTAGRAM_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <button
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
            background: "transparent",
            border: "none",
            cursor: "pointer",
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
        </button>
      </div>
    </section>
  )
}
