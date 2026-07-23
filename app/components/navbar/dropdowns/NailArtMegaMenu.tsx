"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import SmoothImage from "@/app/components/shared/SmoothImage"

type PreviewPost = {
  id: string
  title: string
  slug: string
  cover_image: string | null
}

type NailArtMegaMenuProps = {
  isOpen: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function NailArtMegaMenu({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: NailArtMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)
  const [posts, setPosts] = useState<PreviewPost[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setContentVisible(false)
    const raf = requestAnimationFrame(() => setContentVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || loaded) return
    let cancelled = false
    void fetch("/api/nail-art/list?sort=likes&limit=6")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: PreviewPost[] }) => {
        if (cancelled) return
        setPosts(Array.isArray(json?.data) ? json.data.slice(0, 6) : [])
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([])
          setLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, loaded])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ maxHeight: "calc(100vh - var(--navbar-actual-h) - 80px)" }}
      className={`
        megamenu-hover-bridge absolute left-0 right-0 top-full z-40 hidden md:block
        overflow-y-auto bg-ivory border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-100"
        }
      `}
    >
      <div className="site-container pt-6 pb-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/nail-art"
              onClick={onClose}
              className="flex w-fit items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e] transition-opacity hover:opacity-80"
            >
              Ver todo
            </Link>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-neutral-500">
              Inspírate con diseños hechos por productos de nuestro catálogo
            </p>
          </div>
          <Link
            href="/nail-art#subir"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800"
          >
            Subir inspiración
          </Link>
        </div>

        {!loaded ? (
          <p className="py-6 text-[14px] text-neutral-500">Cargando diseños…</p>
        ) : posts.length === 0 ? (
          <p className="py-6 text-[14px] text-neutral-500">
            Pronto verás diseños aquí.{" "}
            <Link href="/nail-art#subir" onClick={onClose} className="text-[#c6a75e] underline-offset-2 hover:underline">
              Sé la primera en compartir
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {posts.map((post, idx) => (
              <li
                key={post.id}
                className={`transition-opacity duration-300 ease-out ${
                  contentVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDelay: `${Math.min(idx * 30, 240)}ms` }}
              >
                <Link
                  href={`/nail-art/${post.slug}`}
                  onClick={onClose}
                  className="group block"
                >
                  <span className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
                    {post.cover_image ? (
                      <SmoothImage
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="160px"
                      />
                    ) : (
                      <span className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-neutral-200" />
                    )}
                  </span>
                  <span className="mt-2 line-clamp-2 text-[12px] leading-snug text-[#1a1a1a] transition-colors group-hover:text-[#c6a75e]">
                    {post.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
