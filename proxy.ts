import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import {
  getUserLastActivityAt,
  isAdminIdleExpired,
  touchUserLastActivity,
} from "@/lib/supabase/admin-session-activity"

/**
 * Proxy (antes middleware, renombrado en Next.js 16) que protege el panel de
 * administración a nivel de red, antes de renderizar cualquier página.
 *
 * - /admin/*            → requiere sesión con rol admin o receptionist.
 * - /admin/appointments → accesible a admin y receptionist.
 * - Resto de /admin/*   → solo admin.
 * - Staff: timeout por inactividad de 30 min (last_activity_at).
 *
 * Es una capa extra: las páginas/APIs server-side siguen validando por su cuenta.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-lc-pathname", pathname)

  // Home y rutas no-admin: solo propagar pathname (overlay SSR del navbar).
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })

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

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role as string | undefined

  const isStaff = role === "admin" || role === "receptionist"
  if (!isStaff) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Timeout por inactividad (30 min) solo para staff del panel — no clientes.
  const lastActivityAt = await getUserLastActivityAt(user.id)
  if (isAdminIdleExpired(lastActivityAt)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("reason", "inactivity")
    loginUrl.searchParams.set("redirect", pathname)

    const redirectResponse = NextResponse.redirect(loginUrl)
    const signOutClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await signOutClient.auth.signOut()
    return redirectResponse
  }

  // Actividad válida: renovar marca y continuar.
  void touchUserLastActivity(user.id)

  // Recepcionista solo puede entrar a la agenda de citas.
  if (role === "receptionist" && !pathname.startsWith("/admin/appointments")) {
    return NextResponse.redirect(new URL("/admin/appointments", request.url))
  }

  return response
}

export const config = {
  matcher: ["/", "/admin/:path*"],
}
