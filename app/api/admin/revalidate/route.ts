import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"

const ALLOWED_TAGS = new Set([
  "categories",
  "brands",
  "products",
  "best-sellers",
  "top-searches",
  "services",
  "professionals",
  "landing-slots",
  "studio-hours",
])

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "VALIDATION_ERROR") return 400
  return 500
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authResult = await requireAdmin(user?.id)
  if (authResult.error) {
    return NextResponse.json(
      { data: null, error: authResult.error },
      { status: mapStatus(authResult.error.code) }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const requested = Array.isArray((body as { tags?: unknown })?.tags)
    ? ((body as { tags: unknown[] }).tags.filter(
        (t): t is string => typeof t === "string"
      ) as string[])
    : Array.from(ALLOWED_TAGS)

  const tags = requested.filter((t) => ALLOWED_TAGS.has(t))

  if (tags.length === 0) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Ningún tag válido. Permitidos: " + Array.from(ALLOWED_TAGS).join(", "),
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 }
    )
  }

  for (const tag of tags) {
    revalidateTag(tag, "max")
  }

  return NextResponse.json({ data: { revalidated: tags }, error: null })
}
