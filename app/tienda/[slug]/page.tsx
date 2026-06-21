import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getProductBySlugCached as getProductBySlug,
  getRelatedProductsCached,
} from "@/lib/supabase/cache"
import { getServicesCached } from "@/lib/supabase/cache"
import { getPublishedCourses } from "@/lib/supabase/courses"
import { getBlockedSlotsForDate } from "@/lib/supabase/appointments"
import AddToCartButton from "../components/AddToCartButton"
import CoursesCarousel from "../components/CoursesCarousel"
import ProductImageGallery from "../components/ProductImageGallery"
import RelatedProductsCarousel from "../components/RelatedProductsCarousel"
import RecentlyViewed from "../components/RecentlyViewed"
import ServicesSection from "../components/ServicesSection"
import Breadcrumb from "@/components/shared/Breadcrumb"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data } = await getProductBySlug(slug)

  if (!data) {
    return { title: "Producto no encontrado | Liz Cabriales" }
  }

  return {
    title: `${data.name} | Tienda | Liz Cabriales`,
    description: data.description ?? `Conoce ${data.name} en nuestra tienda.`,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const { data: product, error } = await getProductBySlug(slug)

  if (error || !product) notFound()

  const images = product.images ?? []
  const image = images[0] ?? null

  const today = new Date().toISOString().split("T")[0] ?? ""

  const [relatedRes, coursesRes, servicesRes, blockedRes] = await Promise.all([
    getRelatedProductsCached(product.category_id, product.brand, product.id, 8),
    getPublishedCourses(),
    getServicesCached(),
    getBlockedSlotsForDate(today),
  ])

  const relatedProducts = relatedRes.data ?? []
  const upcomingCourses = (coursesRes.data ?? [])
    .filter((c) => c.start_date >= today)
    .slice(0, 8)
  const activeServices = servicesRes.data ?? []
  const courseSlot = (blockedRes.data ?? []).find(
    (slot) => slot.reason?.startsWith("[curso]")
  )
  const hasCourseToday = courseSlot != null

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="site-container pt-5 pb-12">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Tienda", href: "/tienda" },
            { label: product.name },
          ]}
        />

        <section className="mt-6 grid gap-8 md:grid-cols-2">
          <ProductImageGallery images={images} alt={product.name} />

          <div>
            {product.brand ? (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a8862f]">
                {product.brand}
              </p>
            ) : null}

            <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>

            {product.description ? (
              <p className="mt-6 text-[15px] leading-7 text-neutral-700">
                {product.description}
              </p>
            ) : (
              <p className="mt-6 text-[15px] leading-7 text-neutral-500">
                Este producto no tiene descripción disponible por ahora.
              </p>
            )}

            <div className="mt-6">
              <AddToCartButton
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                brand={product.brand ?? null}
                image={image}
                basePrice={product.base_price}
                variants={product.variants}
                enableSelector
                enableQuantitySelector
                className="inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
              />
            </div>

            {/* Shipping info */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-[#0a0a0a]">
                Envío y recolección
              </p>
              <ul className="mt-3 space-y-2.5 text-[13px] text-neutral-600">
                <li className="flex gap-2">
                  <span className="mt-px shrink-0 text-[#a8862f]">•</span>
                  <span>
                    <span className="font-medium text-[#0a0a0a]">Recoger en tienda</span>{" "}
                    {hasCourseToday && courseSlot
                      ? `— Solo ${courseSlot.start_time.slice(0, 5)}–${courseSlot.end_time.slice(0, 5)} (día de curso)`
                      : "— Lu–Vi 10:00–18:30 · Sá 11:00–15:30"}{" "}
                    <span className="text-neutral-400">(Nayarit #204-B, Cd. Madero, Tam.)</span>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-px shrink-0 text-[#a8862f]">•</span>
                  <span>
                    <span className="font-medium text-[#0a0a0a]">Envío con Estafeta o DHL</span>{" "}
                    — Calculamos el costo según tu destino y te mandamos el link de pago por correo y WhatsApp
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-[11px] text-neutral-400">
                Una vez que cubras el envío, ¡salimos a dártelo!
              </p>
            </div>
          </div>
        </section>

        <RelatedProductsCarousel products={relatedProducts} />

        <CoursesCarousel courses={upcomingCourses} />

        <ServicesSection services={activeServices} />

        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            image,
            base_price: product.base_price,
            brand: product.brand ?? null,
          }}
        />
      </div>
    </main>
  )
}
