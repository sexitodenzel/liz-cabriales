import { NextResponse } from "next/server"

import { getCourseById } from "@/lib/supabase/courses"

type Params = Promise<{ id: string }>

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { id } = await params
  const result = await getCourseById(id)
  if (!result.data) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 500
    return NextResponse.json({ data: null, error: result.error }, { status })
  }
  if (!result.data.is_published) {
    return NextResponse.json(
      {
        data: null,
        error: { message: "Curso no disponible", code: "NOT_FOUND" },
      },
      { status: 404 }
    )
  }
  return NextResponse.json({ data: { course: result.data }, error: null })
}
