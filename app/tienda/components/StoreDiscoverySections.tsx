"use client"

import type { CourseWithStats } from "@/lib/supabase/courses"
import type { ProductWithCategory } from "@/lib/supabase/products"
import CoursesCarousel from "./CoursesCarousel"
import RecentlyViewed from "./RecentlyViewed"
import RelatedProductsCarousel from "./RelatedProductsCarousel"

type Props = {
  relatedProducts: ProductWithCategory[]
  courses: CourseWithStats[]
}

export default function StoreDiscoverySections({
  relatedProducts,
  courses,
}: Props) {
  return (
    <>
      <RelatedProductsCarousel products={relatedProducts} />
      <CoursesCarousel courses={courses} />
      <RecentlyViewed />
    </>
  )
}
