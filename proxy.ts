import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas /admin/* — admin: todo el panel; receptionist: solo /admin/appointments/*
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = profile?.role
    const isAppointmentsArea =
      pathname === "/admin/appointments" ||
      pathname.startsWith("/admin/appointments/")

    if (role === "admin") {
      return response
    }

    if (role === "receptionist") {
      if (pathname === "/admin") {
        return NextResponse.redirect(
          new URL("/admin/appointments", request.url)
        )
      }
      if (isAppointmentsArea) {
        return response
      }
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.redirect(new URL("/", request.url))
  }

  // Rutas /perfil/* y /checkout/* — sesión activa
  if (
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/checkout")
  ) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/perfil",
    "/perfil/:path*",
    "/checkout/:path*",
  ],
}
