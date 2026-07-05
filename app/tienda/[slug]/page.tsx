import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getProductBySlugCached as getProductBySlug,
  getRelatedProductsCached,
} from "@/lib/supabase/cache"
import { getServicesCached } from "@/lib/supabase/cache"
import { getPublishedCourses } from "@/lib/supabase/courses"
import { getBlockedSlotsForDate } from "@/lib/supabase/appointments"
import CoursesCarousel from "../components/CoursesCarousel"
import ProductAccordion from "../components/ProductAccordion"
import ProductHero from "../components/ProductHero"
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
    <main className="min-h-screen bg-ivory text-[#0a0a0a]">
      <div className="site-container pt-5 pb-12">
        <div className="mx-auto w-full max-w-[1200px]">
        {/* <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Tienda", href: "/tienda" },
            { label: product.name },
          ]}
        /> */}

        <ProductHero product={product} />

        <ProductAccordion
          description={product.description}
          longDescription={product.long_description}
          applicationText={product.application_text}
          sizeLabels={Array.from(
            new Set(
              product.variants
                .filter((v) => v.is_active && v.size_label)
                .map((v) => v.size_label as string)
            )
          )}
          order={{
            hasCourseToday,
            courseSlot: courseSlot
              ? { start_time: courseSlot.start_time, end_time: courseSlot.end_time }
              : null,
          }}
        />

        <RelatedProductsCarousel products={relatedProducts} />

        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            image,
            base_price: product.base_price,
            brand: product.brand ?? null,
          }}
        />

        <CoursesCarousel courses={upcomingCourses} />

        <ServicesSection services={activeServices} />
        </div>
      </div>
    </main>
  )
}
