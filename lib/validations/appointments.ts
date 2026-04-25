import { z } from "zod"

const uuid = z.string().uuid("ID inválido")
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "La hora debe tener formato HH:MM")
  .transform((v) => (v.length === 5 ? `${v}:00` : v))

export const professionalAnySchema = z.union([uuid, z.literal("any")])

export const createAppointmentSchema = z.object({
  service_ids: z
    .array(uuid)
    .min(1, "Debes seleccionar al menos un servicio")
    .max(10, "Demasiados servicios seleccionados"),
  professional_id: professionalAnySchema,
  date: dateString,
  start_time: timeString,
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

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
