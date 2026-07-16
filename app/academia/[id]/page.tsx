import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import {
  getCourseById,
  getUserRegistrations,
  getCourseGallery,
} from "@/lib/supabase/courses"
import {
  getCourseReviews,
  getReviewEligibility,
  type ReviewEligibility,
} from "@/lib/supabase/course-reviews"
import { getMinDeposit } from "@/lib/utils"
import { getLandingSlots } from "@/lib/supabase/landing-slots"

import CourseDetail from "./CourseDetail"
import CourseReviews from "./CourseReviews"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
}

function isCoursePast(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(y, m - 1, d) < today
}

export default async function AcademiaDetallePage({ params }: Props) {
  const { id } = await params
  const [result, galleryRes, slots] = await Promise.all([
    getCourseById(id),
    getCourseGallery(id),
    getLandingSlots(),
  ])
  const lizPhotoUrl = slots.brand_photo?.trim() || null

  if (!result.data || !result.data.is_published) {
    return (
      <main className="min-h-screen bg-white px-8 py-16 text-[#1a1a1a]">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-semibold">Curso no disponible</h1>
          <p className="mt-3 text-sm text-[#6b6b6b]">
            El evento que buscas no existe o ya no esta publicado.
          </p>
          <Link
            href="/academia"
            className="mt-6 inline-flex rounded-full bg-[#1a1a1a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c6a75e]"
          >
            Ver eventos disponibles
          </Link>
        </div>
      </main>
    )
  }

  const course = result.data
  const minDeposit = getMinDeposit(course.price)
  const isPast = isCoursePast(course.start_date)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let alreadyRegistered = false
  let pendingRegistrationId: string | null = null

  if (user) {
    const regs = await getUserRegistrations(user.id)
    if (regs.data) {
      for (const r of regs.data) {
        if (r.course_id === course.id) {
          if (r.status === "paid") {
            alreadyRegistered = true
            break
          }
          if (r.status === "pending" && !pendingRegistrationId) {
            pendingRegistrationId = r.id
          }
        }
      }
    }
  }

  let reviews = { reviews: [], summary: { average: 0, count: 0 } } as Awaited<
    ReturnType<typeof getCourseReviews>
  >
  let eligibility: ReviewEligibility = { canReview: false, ownReview: null }

  if (isPast) {
    ;[reviews, eligibility] = await Promise.all([
      getCourseReviews(course.id),
      user
        ? getReviewEligibility(course.id, user.id)
        : Promise.resolve<ReviewEligibility>({ canReview: false, ownReview: null }),
    ])
  }

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <CourseDetail
        course={course}
        isPast={isPast}
        isAuthenticated={Boolean(user)}
        alreadyRegistered={alreadyRegistered}
        pendingRegistrationId={pendingRegistrationId}
        minDeposit={minDeposit}
        gallery={galleryRes.data ?? []}
        lizPhotoUrl={lizPhotoUrl}
      />
      {isPast && (
        <div className="site-container">
          <CourseReviews
            courseId={course.id}
            initialReviews={reviews.reviews}
            initialSummary={reviews.summary}
            canReview={eligibility.canReview}
            ownReview={eligibility.ownReview}
          />
        </div>
      )}
    </main>
  )
}
