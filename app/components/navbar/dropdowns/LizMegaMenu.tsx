/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import {
  resolveSobreLizBrandPhoto,
  SOBRE_LIZ_BRAND_PHOTO_FALLBACK,
} from "@/lib/sobre-liz/brand-photo"

type LizMegaMenuProps = {
  isOpen: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const SECTIONS = [
  {
    label: "Su historia",
    description: "Bio, trayectoria y filosofía",
    href: "/sobre-liz#sobre-liz",
  },
  {
    label: "Galería de eventos",
    description: "Masterclasses, talleres y momentos",
    href: "/sobre-liz#eventos",
  },
  {
    label: "Academia",
    description: "Cursos presenciales y certificaciones",
    href: "/academia",
  },
  {
    label: "Distribuidora",
    description: "Marcas profesionales que respaldamos",
    href: "/tienda",
  },
  {
    label: "Servicios",
    description: "Salón y servicio podal",
    href: "/servicios",
  },
] as const

export default function LizMegaMenu({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: LizMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)
  const [featureImage, setFeatureImage] = useState(SOBRE_LIZ_BRAND_PHOTO_FALLBACK)

  useEffect(() => {
    let isMounted = true
    void fetch("/api/landing/brand-photo")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { url?: string } | null) => {
        if (!isMounted || !json?.url) return
        setFeatureImage(resolveSobreLizBrandPhoto(json.url))
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setContentVisible(false)
    const raf = requestAnimationFrame(() => setContentVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

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
        overflow-y-auto bg-white border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div className="site-container py-10">
        <div className="mb-6">
          <Link
            href="/sobre-liz"
            onClick={onClose}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a84c] hover:opacity-80 transition-opacity"
          >
            Ver toda la página
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {/* Feature card */}
          <Link
            href="/sobre-liz"
            onClick={onClose}
            className={`group relative block overflow-hidden rounded-2xl bg-neutral-100 transition-opacity duration-300 ease-out ${
              contentVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={featureImage}
                alt="Liz Cabriales"
                fill
                sizes="320px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-5 pb-5 pt-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a84c]">
                  Spotlight
                </p>
                <p
                  className="mt-1 text-[20px] font-medium leading-tight text-white"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Liz Cabriales
                </p>
                <p className="mt-1 text-[12px] text-white/85">
                  Maestra del arte de las uñas
                </p>
              </div>
            </div>
          </Link>

          {/* Sections list */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {SECTIONS.map((section, idx) => (
              <Link
                key={section.label}
                href={section.href}
                onClick={onClose}
                className={`group flex flex-col gap-1.5 border-l border-[#c9a84c]/25 pl-5 transition-opacity duration-300 ease-out ${
                  contentVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDelay: `${idx * 40}ms` }}
              >
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a] transition-colors group-hover:text-[#c9a84c]">
                  {section.label}
                </span>
                <span className="text-[13px] leading-snug text-neutral-500">
                  {section.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
