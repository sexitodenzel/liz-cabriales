# Sprint Actual — Sprint 5

> Este archivo dice exactamente qué estás construyendo HOY. Léelo al iniciar cada sesión de trabajo. Actualízalo al terminar cada sesión con el estado real.

---

## Sprint 5 — Recepción, perfil cliente y pre-lanzamiento

**Objetivo concreto:** Cerrar el acceso por roles para operación diaria, completar perfil cliente unificado y dejar checklist técnico/funcional listo para deploy.

**Inicio:** 20 abril 2026  
**Fin estimado:** 10 mayo 2026  
**Sprint review con Liz:** primera semana de mayo 2026

---

## Scope — qué SÍ entra en este sprint

- [ ] Rol recepcionista (`users.role` + middleware)
- [ ] Permisos recepcionista — acceso limitado a `/admin/appointments`
- [ ] Página `/perfil` cliente con historial de pedidos, citas y cursos
- [ ] Flujo CFDI en checkout (checkbox, RFC, razón social, % adicional)
- [ ] Nav público actualizado con nuevas rutas activas
- [ ] QA general móvil (flujo ecommerce, citas y cursos)
- [ ] Checklist pre-lanzamiento completo

## Scope — qué NO entra en este sprint

✗ Nuevos módulos funcionales fuera de recepción/perfil/CFDI  
✗ Rediseño visual completo de UI  
✗ Integraciones externas adicionales no críticas para lanzamiento

---

## ⚠️ Pendientes operativos — ejecutar antes de QA

| Acción                                                                                                                                    | Responsable | Estado         |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| Configurar `CRON_SECRET` en Vercel (`openssl rand -hex 32`)                                                                               | Denzel      | ⏳ Pendiente    |
| Actualizar `SALON_ADDRESS` real en `lib/email/templates/_shared.ts`                                                                       | Denzel + Liz| ⏳ Pendiente    |
| Verificar dominio de envío en Resend para salida de sandbox                                                                               | Liz         | ⏳ Pendiente    |

---

## Estado de tareas

| Tarea | Estado | Notas |
|---|---|---|
| Sprint 2 — enlace `/admin/orders` en dashboard admin | ✅ Hecho | Cierre administrativo del sprint |
| Sprint 3 — módulo de citas completo | ✅ Hecho | API + páginas + admin + emails + cron + DB |
| Sprint 4 — módulo de cursos completo | ✅ Hecho | API + páginas + admin + email + DB |
| Webhook MP para `appointment:` y `course:` | ✅ Hecho | Ruta `app/api/webhooks/mercadopago/route.ts` |
| Typecheck global (`tsc --noEmit`) | ✅ Hecho | Limpio en todo el proyecto |
| Rol recepcionista | ⏳ Pendiente | Sprint 5 |
| `/perfil` cliente consolidado | ⏳ Pendiente | Sprint 5 |
| CFDI en checkout | ⏳ Pendiente | Sprint 5 |

---

## Bloqueadores de este sprint

| Bloqueador | Responsable | Estado |
|---|---|---|
| `CRON_SECRET` faltante en Vercel | Denzel | ⚠️ Pendiente |
| Dirección real del salón para emails | Liz | ⚠️ Pendiente |
| Dominio Resend sin verificar | Liz | ⚠️ Pendiente |

---

## Archivos creados en este sprint

- `app/admin/appointments/page.tsx`
- `app/admin/appointments/AdminAppointmentsClient.tsx`
- `app/admin/appointments/components/NewAppointmentModal.tsx`
- `app/admin/appointments/components/BlockSlotModal.tsx`
- `app/admin/appointments/components/RescheduleAppointmentModal.tsx`
- `lib/supabase/appointments.ts`
- `lib/validations/appointments.ts`
- `app/citas/page.tsx`
- `app/citas/CitasClient.tsx`
- `app/cita/[id]/page.tsx`
- `app/cita/[id]/error/page.tsx`
- `app/api/appointments/route.ts`
- `app/api/appointments/availability/route.ts`
- `app/api/admin/appointments/route.ts`
- `app/api/admin/blocked-slots/route.ts`
- `app/api/payments/appointment/route.ts`
- `app/api/cron/appointment-reminders/route.ts`
- `app/admin/courses/page.tsx`
- `app/admin/courses/AdminCoursesClient.tsx`
- `app/admin/courses/components/CourseForm.tsx`
- `app/admin/courses/[id]/registrations/page.tsx`
- `app/admin/courses/[id]/registrations/RegistrationsClient.tsx`
- `app/admin/courses/[id]/registrations/components/ManualRegistrationModal.tsx`
- `lib/supabase/courses.ts`
- `lib/validations/courses.ts`
- `lib/utils.ts`
- `app/cursos/page.tsx`
- `app/cursos/[id]/page.tsx`
- `app/curso/[courseId]/inscripcion/[id]/page.tsx`
- `app/curso/[courseId]/inscripcion/[id]/error/page.tsx`
- `app/api/courses/route.ts`
- `app/api/course-registrations/route.ts`
- `app/api/payments/course/route.ts`
- `app/api/admin/courses/route.ts`
- `app/api/admin/courses/[id]/registrations/route.ts`
- `lib/email/templates/_shared.ts`
- `lib/email/templates/appointment-confirmation.ts`
- `lib/email/templates/appointment-reminder.ts`
- `lib/email/templates/appointment-rescheduled.ts`
- `lib/email/templates/course-registration.ts`
- `lib/email/templates/welcome-client.ts`
- `lib/supabase/adminUsers.ts`
- `app/api/admin/users/route.ts`
- `vercel.json`

## Archivos modificados en este sprint

- `app/admin/AdminDashboardClient.tsx` — enlace a `/admin/orders`
- `app/api/webhooks/mercadopago/route.ts` — soporte de prefijos `appointment:` y `course:`

---

## Notas de sesiones

### 9 abril 2026
- Sprint 1 cerrado al 100% — producción estable
- Análisis de deuda técnica realizado — 8 puntos clasificados
- Backlog actualizado con deuda técnica y nuevos ítems de Sprint 2

### 9 abril 2026 (segundo bloque)
- Sprint 2 arrancado — primera tarea entregada
- `create_order_atomic`, `email_sent`, limpieza de carrito implementados
- Panel admin `/admin/orders` y detalle `/admin/orders/[id]` operativos
- Build correcto — lint falla en archivos previos fuera de scope, no en los nuevos
- Pendiente crítico: ejecutar 2 SQL en Supabase antes de QA

### 20 abril 2026
- Sprint 2 cerrado formalmente con enlace `/admin/orders` en dashboard admin
- Sprint 3 cerrado: citas completas (wizard, agenda admin, bloqueo, reprogramación, pagos, emails, cron)
- Sprint 4 cerrado: cursos completos (catálogo, inscripción, pagos, admin cursos/inscritos, email)
- Se incorporó creación de cliente desde admin y email de bienvenida
- Webhook MercadoPago extendido para `appointment:` y `course:`
- Typecheck global limpio con `tsc --noEmit`