import { z } from "zod"

// Protección contra inyección SQL y XSS en campos de texto libre
const DANGEROUS_PATTERN = /(?:--|\/\*|\*\/|;\s*[\r\n]|\x00|<script|javascript:|<iframe)/i

function isSafeText(value: string): boolean {
  return !DANGEROUS_PATTERN.test(value)
}

function safeOpt(maxLen = 300) {
  return z
    .string()
    .trim()
    .max(maxLen, "El campo es demasiado largo")
    .refine(isSafeText, "El campo contiene caracteres no permitidos")
    .optional()
}

const rfcSchema = z
  .string()
  .trim()
  .min(12, "El RFC debe tener al menos 12 caracteres")
  .max(13, "El RFC admite como máximo 13 caracteres")
  .regex(/^[A-ZÑ&0-9]+$/i, "El RFC solo puede contener letras y números")

const razonSocialSchema = z
  .string()
  .trim()
  .min(1, "La razón social es obligatoria para facturación")
  .max(200, "La razón social es demasiado larga")
  .refine(isSafeText, "La razón social contiene caracteres no permitidos")

export const createOrderSchema = z
  .object({
    delivery_type: z.enum(["shipping", "pickup"]),
    // Campos para emitir guías (todos requeridos si delivery_type === "shipping")
    nombre_completo: safeOpt(160),
    calle_numero:    safeOpt(200),
    colonia:         safeOpt(120),
    cp:              z.string().trim().max(5).regex(/^\d{0,5}$/, "CP inválido").optional(),
    municipio:       safeOpt(100),
    ciudad:          safeOpt(100),
    estado:          safeOpt(100),
    telefono:        z.string().trim().max(15).optional(),
    entre_calles:    safeOpt(200),
    referencia:      safeOpt(400),
    // Factura
    requires_invoice: z.boolean().optional().default(false),
    rfc:              z.string().trim().max(13).optional(),
    razon_social:     z.string().trim().max(200).optional(),
    invoice_email:    z.string().trim().max(320).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.delivery_type !== "shipping") return

    const required = [
      ["nombre_completo", "El nombre completo"],
      ["calle_numero", "La calle y número de casa"],
      ["colonia", "La colonia"],
      ["cp", "El código postal"],
      ["municipio", "El municipio"],
      ["ciudad", "La ciudad"],
      ["estado", "El estado"],
      ["telefono", "El teléfono"],
      ["entre_calles", "Las calles de referencia"],
      ["referencia", "La referencia del domicilio"],
    ] as const

    for (const [field, label] of required) {
      if (!value[field]?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${label} es obligatorio`,
        })
      }
    }

    // Validar formato teléfono: 10 dígitos locales
    const tel = value.telefono?.trim() ?? ""
    if (tel && !/^\d{10}$/.test(tel)) {
      ctx.addIssue({
        code: "custom",
        path: ["telefono"],
        message: "El teléfono debe tener 10 dígitos (sin código de país)",
      })
    }

    // Validar CP: exactamente 5 dígitos
    const cp = value.cp?.trim() ?? ""
    if (cp && !/^\d{5}$/.test(cp)) {
      ctx.addIssue({
        code: "custom",
        path: ["cp"],
        message: "El código postal debe tener 5 dígitos",
      })
    }
  })
  .superRefine((value, ctx) => {
    if (!value.requires_invoice) return

    const rfc = value.rfc?.trim() ?? ""
    const rs = value.razon_social?.trim() ?? ""

    const rfcParsed = rfcSchema.safeParse(rfc)
    if (!rfcParsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["rfc"],
        message: rfcParsed.error.issues[0]?.message ?? "RFC inválido",
      })
    }

    const rsParsed = razonSocialSchema.safeParse(rs)
    if (!rsParsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["razon_social"],
        message: rsParsed.error.issues[0]?.message ?? "Razón social inválida",
      })
    }

    const email = value.invoice_email?.trim() ?? ""
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({
        code: "custom",
        path: ["invoice_email"],
        message: "Correo de facturación inválido",
      })
    }
  })
  .transform((value) => {
    let shippingAddress: string | undefined
    let shippingState: string | undefined
    let shippingCity: string | undefined

    if (value.delivery_type === "shipping") {
      const lines: string[] = []
      if (value.nombre_completo?.trim()) lines.push(`Nombre: ${value.nombre_completo.trim()}`)
      if (value.calle_numero?.trim())    lines.push(`Calle/Núm: ${value.calle_numero.trim()}`)
      if (value.colonia?.trim())         lines.push(`Colonia: ${value.colonia.trim()}`)
      if (value.cp?.trim())              lines.push(`CP: ${value.cp.trim()}`)
      if (value.municipio?.trim())       lines.push(`Municipio: ${value.municipio.trim()}`)
      if (value.telefono?.trim())        lines.push(`Tel: ${value.telefono.trim()}`)
      if (value.entre_calles?.trim())    lines.push(`Entre calles: ${value.entre_calles.trim()}`)
      if (value.referencia?.trim())      lines.push(`Referencia: ${value.referencia.trim()}`)
      shippingAddress = lines.join("\n") || undefined
      shippingState   = value.estado?.trim() || undefined
      shippingCity    = value.ciudad?.trim() || undefined
    }

    return {
      delivery_type:    value.delivery_type,
      shipping_address: shippingAddress,
      shipping_state:   shippingState,
      shipping_city:    shippingCity,
      requires_invoice: Boolean(value.requires_invoice),
      rfc:              value.requires_invoice ? (value.rfc ?? "").trim().toUpperCase() : undefined,
      razon_social:     value.requires_invoice ? (value.razon_social ?? "").trim() : undefined,
      invoice_email:    value.requires_invoice ? (value.invoice_email ?? "").trim() || undefined : undefined,
    }
  })

export type CreateOrderInput = z.infer<typeof createOrderSchema>
