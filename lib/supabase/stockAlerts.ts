import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "./server"

type SupabaseError = {
  message: string
  code?: string
}

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type StockAlertStatus = "pending" | "notified" | "cancelled"

export type UserStockAlert = {
  id: string
  variant_id: string
  product_id: string
  status: StockAlertStatus
  created_at: string
}

export type PendingStockAlertRow = {
  id: string
  user_id: string
  product_id: string
  variant_id: string
  users: {
    first_name: string | null
    last_name: string | null
    email: string
    phone: string | null
    phone_verified: boolean
    whatsapp_opt_in: boolean
  } | null
  products: {
    name: string
    slug: string
  } | null
  product_variants: {
    variant_name: string
  } | null
}

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

async function getVariantForSubscribe(
  variantId: string
): Promise<
  Result<{
    id: string
    product_id: string
    stock: number
    is_active: boolean
  }>
> {
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .select("id, product_id, stock, is_active")
    .eq("id", variantId)
    .maybeSingle()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: "Presentación no encontrada",
        code: "NOT_FOUND",
      },
    }
  }

  return {
    data: {
      id: data.id as string,
      product_id: data.product_id as string,
      stock: Number(data.stock),
      is_active: Boolean(data.is_active),
    },
    error: null,
  }
}

export async function getUserStockAlert(
  supabase: SupabaseClient,
  userId: string,
  variantId: string
): Promise<Result<UserStockAlert | null>> {
  const { data, error } = await supabase
    .from("stock_alerts")
    .select("id, variant_id, product_id, status, created_at")
    .eq("user_id", userId)
    .eq("variant_id", variantId)
    .eq("status", "pending")
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  if (!data) {
    return { data: null, error: null }
  }

  return {
    data: {
      id: data.id as string,
      variant_id: data.variant_id as string,
      product_id: data.product_id as string,
      status: data.status as StockAlertStatus,
      created_at: data.created_at as string,
    },
    error: null,
  }
}

export async function subscribeStockAlert(
  supabase: SupabaseClient,
  userId: string,
  variantId: string
): Promise<Result<UserStockAlert>> {
  const variantResult = await getVariantForSubscribe(variantId)
  if (variantResult.error || !variantResult.data) {
    return { data: null, error: variantResult.error! }
  }

  const variant = variantResult.data
  if (!variant.is_active) {
    return {
      data: null,
      error: {
        message: "Esta presentación no está disponible",
        code: "NOT_FOUND",
      },
    }
  }

  if (variant.stock > 0) {
    return {
      data: null,
      error: {
        message: "Este producto ya tiene inventario disponible",
        code: "NOT_OUT_OF_STOCK",
      },
    }
  }

  const existingResult = await getUserStockAlert(supabase, userId, variantId)
  if (existingResult.error) {
    return { data: null, error: existingResult.error }
  }
  if (existingResult.data) {
    return {
      data: null,
      error: {
        message: "Ya te avisaremos cuando vuelva a estar disponible",
        code: "ALREADY_SUBSCRIBED",
      },
    }
  }

  const { data: priorRow } = await supabase
    .from("stock_alerts")
    .select("id")
    .eq("user_id", userId)
    .eq("variant_id", variantId)
    .in("status", ["notified", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (priorRow?.id) {
    const { data, error } = await supabase
      .from("stock_alerts")
      .update({
        status: "pending",
        notified_at: null,
        product_id: variant.product_id,
      })
      .eq("id", priorRow.id)
      .select("id, variant_id, product_id, status, created_at")
      .single()

    if (error || !data) {
      return {
        data: null,
        error: {
          message: error?.message ?? "No se pudo activar la alerta",
          code: error?.code,
        },
      }
    }

    return {
      data: {
        id: data.id as string,
        variant_id: data.variant_id as string,
        product_id: data.product_id as string,
        status: data.status as StockAlertStatus,
        created_at: data.created_at as string,
      },
      error: null,
    }
  }

  const { data, error } = await supabase
    .from("stock_alerts")
    .insert({
      user_id: userId,
      product_id: variant.product_id,
      variant_id: variantId,
      status: "pending",
    })
    .select("id, variant_id, product_id, status, created_at")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear la alerta",
        code: error?.code,
      },
    }
  }

  return {
    data: {
      id: data.id as string,
      variant_id: data.variant_id as string,
      product_id: data.product_id as string,
      status: data.status as StockAlertStatus,
      created_at: data.created_at as string,
    },
    error: null,
  }
}

export async function cancelStockAlert(
  supabase: SupabaseClient,
  userId: string,
  variantId: string
): Promise<Result<null>> {
  const { error } = await supabase
    .from("stock_alerts")
    .update({ status: "cancelled" })
    .eq("user_id", userId)
    .eq("variant_id", variantId)
    .eq("status", "pending")

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

export async function getPendingAlertsForVariant(
  variantId: string
): Promise<Result<PendingStockAlertRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("stock_alerts")
    .select(
      `id,
       user_id,
       product_id,
       variant_id,
       users (
         first_name,
         last_name,
         email,
         phone,
         phone_verified,
         whatsapp_opt_in
       ),
       products (
         name,
         slug
       ),
       product_variants (
         variant_name
       )`
    )
    .eq("variant_id", variantId)
    .eq("status", "pending")

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    product_id: row.product_id as string,
    variant_id: row.variant_id as string,
    users: unwrap(row.users as unknown as PendingStockAlertRow["users"]),
    products: unwrap(row.products as unknown as PendingStockAlertRow["products"]),
    product_variants: unwrap(
      row.product_variants as unknown as PendingStockAlertRow["product_variants"]
    ),
  }))

  return { data: rows, error: null }
}

export async function markStockAlertsNotified(alertIds: string[]): Promise<void> {
  if (alertIds.length === 0) return

  const { error } = await supabaseAdmin
    .from("stock_alerts")
    .update({
      status: "notified",
      notified_at: new Date().toISOString(),
    })
    .in("id", alertIds)
    .eq("status", "pending")

  if (error) {
    console.error("[stock-alerts] Error marcando alertas como notificadas:", error)
  }
}
