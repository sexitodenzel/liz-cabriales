export type TextParameter = { type: "text"; text: string }

export type TemplateComponent =
  | { type: "body"; parameters: TextParameter[] }
  | { type: "button"; sub_type: string; index: string; parameters: TextParameter[] }

/**
 * Envía un mensaje de plantilla por WhatsApp Cloud API (Meta).
 * Si WHATSAPP_ACCESS_TOKEN no está configurado, loguea y retorna sin lanzar —
 * el resto del flujo (MP, email) sigue funcionando.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components: TemplateComponent[]
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    console.warn(
      `[whatsapp] WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configurados. ` +
      `Mensaje a ${to} (${templateName}) omitido.`
    )
    return
  }

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const errorText = await res.text().catch(() => "(sin cuerpo)")
    console.error(
      `[whatsapp] Error enviando ${templateName} a ${to}: HTTP ${res.status} — ${errorText}`
    )
  }
}
