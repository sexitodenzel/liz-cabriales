import { createClient } from "@supabase/supabase-js"

import { sendProductBackInStockEmail } from "@/lib/email/templates/product-back-in-stock"
import {
  getPendingAlertsForVariant,
  markStockAlertsNotified,
} from "@/lib/supabase/stockAlerts"
import { sendWhatsAppTemplate } from "./whatsapp-client"
import {
  TEMPLATE_LANGUAGE,
  TEMPLATE_NAMES,
  buildProductBackInStockComponents,
} from "./templates"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMAIL_TEMPLATE = "product_back_in_stock"
const WA_TEMPLATE = TEMPLATE_NAMES.PRODUCT_BACK_IN_STOCK

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://lizcabriales.com"
  )
}

async function claimNotification(
  alertId: string,
  channel: "email" | "whatsapp",
  templateName: string,
  recipientPhone?: string | null
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("notification_log").insert({
    entity_type: "stock_alert",
    entity_id: alertId,
    channel,
    template_name: templateName,
    recipient_phone: recipientPhone ?? null,
  })

  if (error) {
    if (error.code === "23505") return false
    console.error(`[stock-alert-notifications] Error en notification_log:`, error)
    return false
  }

  return true
}

export async function notifyStockAlertsForVariant(
  variantId: string,
  previousStock: number,
  newStock: number
): Promise<void> {
  if (!(previousStock <= 0 && newStock > 0)) return

  const alertsResult = await getPendingAlertsForVariant(variantId)
  if (alertsResult.error || !alertsResult.data?.length) {
    if (alertsResult.error) {
      console.error(
        `[stock-alert-notifications] Error obteniendo alertas para variante ${variantId}:`,
        alertsResult.error
      )
    }
    return
  }

  const notifiedIds: string[] = []
  const baseUrl = getAppBaseUrl()

  for (const alert of alertsResult.data) {
    const user = alert.users
    const product = alert.products
    const variant = alert.product_variants

    if (!user || !product) {
      console.warn(
        `[stock-alert-notifications] Alerta ${alert.id} sin datos de usuario o producto, omitida`
      )
      continue
    }

    const firstName = user.first_name?.trim() || "Cliente"
    const productName = product.name
    const variantName = variant?.variant_name ?? null
    const productUrl = `${baseUrl}/tienda/${product.slug}`

    const emailClaimed = await claimNotification(alert.id, "email", EMAIL_TEMPLATE)
    if (emailClaimed) {
      await sendProductBackInStockEmail({
        firstName,
        email: user.email,
        productName,
        variantName,
        productUrl,
      })
    }

    if (user.phone && user.phone_verified && user.whatsapp_opt_in) {
      const waClaimed = await claimNotification(
        alert.id,
        "whatsapp",
        WA_TEMPLATE,
        user.phone
      )
      if (waClaimed) {
        await sendWhatsAppTemplate(
          user.phone,
          WA_TEMPLATE,
          TEMPLATE_LANGUAGE,
          buildProductBackInStockComponents(firstName, productName, productUrl)
        )
      }
    }

    notifiedIds.push(alert.id)
  }

  await markStockAlertsNotified(notifiedIds)
}
