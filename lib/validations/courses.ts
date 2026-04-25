import { z } from "zod"

const uuid = z.string().uuid("ID inválido")
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "La hora debe tener formato HH:MM")
  .transform((v) => (v.length === 5 ? `${v}:00` : v))

export const courseLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "open",
])

export const createCourseSchema = z
  .object({
    title: z.string().trim().min(3, "El título es demasiado corto").max(160),
    description: z.string().trim().min(1, "La descripción es requerida"),
    instructor_id: uuid,
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    capacity: z.coerce.number().int().min(1, "El cupo debe ser al menos 1"),
    level: courseLevelSchema,
    start_date: dateString,
    end_date: dateString.optional().nullable(),
    start_time: timeString,
    location: z.string().trim().min(1, "La ubicación es requerida").max(200),
    cover_image: z
      .string()
      .trim()
      .max(500)
      .url("Debe ser una URL válida")
      .optional()
      .nullable()
      .or(z.literal("")),
    is_published: z.boolean().optional().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.end_date && v.end_date < v.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "La fecha de fin no puede ser anterior a la de inicio",
      })
    }
  })

export type CreateCourseInput = z.infer<typeof createCourseSchema>

export const updateCourseSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(1).optional(),
  instructor_id: uuid.optional(),
  price: z.coerce.number().min(0).optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  level: courseLevelSchema.optional(),
  start_date: dateString.optional(),
  end_date: dateString.optional().nullable(),
  start_time: timeString.optional(),
  location: z.string().trim().min(1).max(200).optional(),
  cover_image: z
    .string()
    .trim()
    .max(500)
    .url("Debe ser una URL válida")
    .optional()
    .nullable()
    .or(z.literal("")),
  is_published: z.boolean().optional(),
})

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

export const createRegistrationSchema = z.object({
  course_id: uuid,
  attendees: z.coerce
    .number()
    .int()
    .min(1, "Debes inscribir al menos 1 asistente")
    .max(20, "Demasiados asistentes"),
})

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>

export const manualRegistrationSchema = z
  .object({
    user_id: uuid.optional().nullable(),
    client_name: z.string().trim().min(1).max(120).optional().nullable(),
    client_email: z
      .string()
      .trim()
      .email("Email inválido")
      .max(160)
      .optional()
      .nullable(),
    attendees: z.coerce.number().int().min(1).max(20),
  })
  .superRefine((v, ctx) => {
    if (!v.user_id && !v.client_name) {
      ctx.addIssue({
        code: "custom",
        path: ["client_name"],
        message:
          "Debes vincular un usuario existente o proporcionar el nombre del cliente",
      })
    }
  })

export type ManualRegistrationInput = z.infer<typeof manualRegistrationSchema>

export const createCoursePaymentSchema = z.object({
  registration_id: uuid,
  amount: z.coerce.number().min(1, "El monto debe ser mayor a 0"),
})

export type CreateCoursePaymentInput = z.infer<typeof createCoursePaymentSchema>
