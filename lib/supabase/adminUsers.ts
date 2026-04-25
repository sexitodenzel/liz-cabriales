import { randomBytes } from "crypto"

import { createClient as createServiceClient } from "@supabase/supabase-js"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type CreateClientFromAdminInput = {
  firstName: string
  lastName: string
  email: string
}

export type CreateClientFromAdminResult = {
  user_id: string
  email: string
  first_name: string
  last_name: string
}

/**
 * Crea un usuario en auth.users con contraseña temporal aleatoria.
 * El trigger existente en Supabase crea el perfil en public.users
 * automáticamente. Después actualizamos first_name/last_name por si
 * el trigger no los lee del user_metadata.
 *
 * El cliente obtiene acceso usando "Olvidé mi contraseña".
 */
export async function createClientFromAdmin(
  input: CreateClientFromAdminInput
): Promise<Result<CreateClientFromAdminResult>> {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim().toLowerCase()

  if (!firstName || !lastName || !email) {
    return {
      data: null,
      error: {
        message: "Nombre, apellido y email son obligatorios",
        code: "VALIDATION_ERROR",
      },
    }
  }

  // Contraseña temporal. El cliente la reemplaza vía "Olvidé mi contraseña".
  const temporaryPassword = randomBytes(16).toString("hex")

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

  if (createError || !created.user) {
    return {
      data: null,
      error: {
        message: createError?.message ?? "No se pudo crear el usuario",
        code: "USER_CREATE_FAILED",
      },
    }
  }

  const userId = created.user.id

  // Aseguramos que el perfil en public.users tenga first_name/last_name.
  // Si el trigger ya los escribió, este update es idempotente.
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", userId)

  if (updateError) {
    console.warn(
      `[adminUsers] No se pudieron actualizar first_name/last_name para ${userId}:`,
      updateError.message
    )
  }

  return {
    data: {
      user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
    },
    error: null,
  }
}
