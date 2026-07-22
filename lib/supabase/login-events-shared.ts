export type LoginMethod =
  | "password"
  | "oauth"
  | "magic_link"
  | "invite"
  | "recovery"
  | "unknown"

export type LoginEvent = {
  id: string
  user_id: string | null
  email: string | null
  full_name: string | null
  role: string | null
  method: LoginMethod
  ip: string | null
  user_agent: string | null
  created_at: string
}

export type RecordLoginEventInput = {
  userId: string
  email?: string | null
  fullName?: string | null
  role?: string | null
  method: LoginMethod
  ip?: string | null
  userAgent?: string | null
}

export function formatLoginMethod(method: string): string {
  switch (method) {
    case "password":
      return "Contraseña"
    case "oauth":
      return "OAuth / Google"
    case "magic_link":
      return "Enlace mágico"
    case "invite":
      return "Invitación"
    case "recovery":
      return "Recuperación"
    default:
      return "Otro"
  }
}
