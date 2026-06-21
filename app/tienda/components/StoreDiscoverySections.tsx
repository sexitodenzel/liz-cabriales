"use client"

import type { CourseWithStats } from "@/lib/supabase/courses"
import type { ServiceRow } from "@/lib/supabase/appointments"
import type { ProductWithCategory } from "@/lib/supabase/products"
import CoursesCarousel from "./CoursesCarousel"
import RecentlyViewed from "./RecentlyViewed"
import RelatedProductsCarousel from "./RelatedProductsCarousel"
import ServicesSection from "./ServicesSection"

type Props = {
  relatedProducts: ProductWithCategory[]
  courses: CourseWithStats[]
  services: ServiceRow[]
}

export default function StoreDiscoverySections({
  relatedProducts,
  courses,
  services,
}: Props) {
  return (
    <>
      <RelatedProductsCarousel products={relatedProducts} />
      <CoursesCarousel courses={courses} />
      <ServicesSection services={services} />
      <RecentlyViewed />
    </>
  )
}
