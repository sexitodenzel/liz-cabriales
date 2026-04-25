import { NextResponse } from "next/server"

import { getPublishedCourses } from "@/lib/supabase/courses"

export async function GET() {
  const result = await getPublishedCourses()
  if (!result.data) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: 500 }
    )
  }
  return NextResponse.json({ data: { courses: result.data }, error: null })
}
