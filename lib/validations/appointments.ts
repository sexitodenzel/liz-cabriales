import { z } from "zod"

const uuid = z.string().uuid("ID inválido")
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "La hora debe tener formato HH:MM")
  .transform((v) => (v.length === 5 ? `${v}:00` : v))

const closeTimeString = z
  .string()
  .regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)(:[0-5]\d)?$/, "La hora de cierre es inválida")
  .transform((v) => {
    if (v.startsWith("24")) return "24:00:00"
    return v.length === 5 ? `${v}:00` : v
  })

export const professionalAnySchema = z.union([uuid, z.literal("any")])

const appointmentCoreSchema = z.object({
  service_ids: z
    .array(uuid)
    .min(1, "Debes seleccionar al menos un servicio")
    .max(10, "Demasiados servicios seleccionados"),
  service_selections: z
    .array(
      z.object({
        service_id: uuid,
        option_ids: z.array(uuid).max(20),
      })
    )
    .optional(),
  professional_id: professionalAnySchema,
  date: dateString,
  start_time: timeString,
})

export const createAppointmentSchema = appointmentCoreSchema.extend({
  client_phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .min(10, "Ingresa tu número de celular (10 dígitos)")
        .max(10, "El celular debe tener 10 dígitos")
        .regex(/^\d{10}$/, "El celular debe tener 10 dígitos")
    ),
})

export type CreateAppointmentInput = z.infer<typeof appointmentCoreSchema>

export const cancelAppointmentSchema = z.object({
  appointment_id: uuid,
})

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>

export const blockedSlotSchema = z
  .object({
    professional_id: uuid,
    date: dateString,
    start_time: timeString,
    end_time: timeString,
    reason: z.string().trim().max(200).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.start_time >= value.end_time) {
      ctx.addIssue({
        code: "custom",
        path: ["end_time"],
        message: "La hora de fin debe ser posterior a la hora de inicio",
      })
    }
  })

export type BlockedSlotInput = z.infer<typeof blockedSlotSchema>

export const blockedSlotHoursSchema = blockedSlotSchema

export const blockedSlotDaysSchema = z
  .object({
    mode: z.literal("days"),
    professional_id: uuid,
    start_date: dateString,
    end_date: dateString,
    reason: z.string().trim().max(200).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.start_date > value.end_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "La fecha final debe ser posterior o igual a la inicial",
      })
    }
  })

export const blockedSlotCreateSchema = z.discriminatedUnion("mode", [
  blockedSlotHoursSchema.extend({ mode: z.literal("hours") }),
  blockedSlotDaysSchema,
])

export type BlockedSlotCreateInput = z.infer<typeof blockedSlotCreateSchema>

export const studioWeeklyHourRowSchema = z
  .object({
    day_of_week: z.coerce.number().int().min(0).max(6),
    is_open: z.boolean(),
    open_time: timeString,
    close_time: closeTimeString,
  })
  .superRefine((value, ctx) => {
    if (!value.is_open) return
    const open = value.open_time.slice(0, 5)
    const close = value.close_time.startsWith("24")
      ? "24:00"
      : value.close_time.slice(0, 5)
    if (open >= close) {
      ctx.addIssue({
        code: "custom",
        path: ["close_time"],
        message: "La hora de cierre debe ser posterior a la de inicio",
      })
    }
  })

export const studioWeeklyHoursUpdateSchema = z.object({
  hours: z.array(studioWeeklyHourRowSchema).length(7),
})

export const studioSettingsUpdateSchema = z.object({
  transfer_account_number: z
    .string()
    .trim()
    .max(80, "El número es demasiado largo"),
})

export type StudioWeeklyHoursUpdateInput = z.infer<
  typeof studioWeeklyHoursUpdateSchema
>

export const availabilityQuerySchema = z.object({
  date: dateString,
  professional_id: professionalAnySchema,
  duration_min: z.coerce
    .number()
    .int()
    .min(15, "Duración mínima 15 minutos")
    .max(600, "Duración máxima 600 minutos"),
})

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>

export const adminAppointmentsQuerySchema = z.object({
  date: dateString.optional(),
  professional_id: uuid.optional(),
  status: z
    .enum(["pending", "paid", "completed", "cancelled"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export type AdminAppointmentsQuery = z.infer<typeof adminAppointmentsQuerySchema>

export const createAppointmentPaymentSchema = z.object({
  appointment_id: uuid,
})

export type CreateAppointmentPaymentInput = z.infer<
  typeof createAppointmentPaymentSchema
>

export const adminCreateAppointmentSchema = z
  .object({
    service_ids: z.array(uuid).min(1).max(10),
    service_selections: z
      .array(
        z.object({
          service_id: uuid,
          option_ids: z.array(uuid).max(20),
        })
      )
      .optional(),
    professional_id: uuid,
    date: dateString,
    start_time: timeString,
    user_id: uuid.optional().nullable(),
    client_name: z.string().trim().min(1).max(120).optional().nullable(),
    client_phone: z.string().trim().max(40).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.user_id && !value.client_name) {
      ctx.addIssue({
        code: "custom",
        path: ["client_name"],
        message:
          "Debes vincular un usuario existente o indicar el nombre del cliente",
      })
    }
  })

export type AdminCreateAppointmentInput = z.infer<
  typeof adminCreateAppointmentSchema
>

export const rescheduleAppointmentSchema = z.object({
  date: dateString,
  start_time: timeString,
  professional_id: uuid.optional(),
})

export type RescheduleAppointmentRequest = z.infer<
  typeof rescheduleAppointmentSchema
>

export const adminProfessionalCreateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  bio: z.string().trim().max(500).optional().nullable(),
  photo_url: z
    .string()
    .trim()
    .url("URL de foto inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  filter_ids: z.array(z.string().uuid()).optional(),
})

export const adminProfessionalUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    is_active: z.boolean().optional(),
    bio: z.string().trim().max(500).optional().nullable(),
    photo_url: z
      .string()
      .trim()
      .url("URL de foto inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    filter_ids: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.is_active !== undefined ||
      value.bio !== undefined ||
      value.photo_url !== undefined ||
      value.filter_ids !== undefined,
    {
      message: "Debes indicar al menos un campo a actualizar",
    }
  )
