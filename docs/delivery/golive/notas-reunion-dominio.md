# Notas de reunión — Dominio, Supabase y Go-Live

**Fecha:** 2026-05-31  
**Contexto:** Reunión con la hija de Liz Cabriales para definir el orden de trabajo antes del lanzamiento.

---

## Estado de SQL en Supabase

| Archivo | Estado |
|---------|--------|
| `sql-course-display-settings.sql` | ✅ Ya ejecutado |
| `sql-sprint5-supabase.sql` | ❌ Pendiente — CRÍTICO (sin esto Google OAuth rompe) |
| `sql-sprint-whatsapp.sql` | ❌ Pendiente (sin esto el panel admin rompe en órdenes con envío) |

### Queries para verificar en Supabase SQL Editor

```sql
-- ¿Trigger de OAuth existe?
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'handle_new_user';

-- ¿Columna phone en users?
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';

-- ¿Tabla notification_log?
SELECT table_name FROM information_schema.tables WHERE table_name = 'notification_log';
```
Si alguna regresa vacío → ese SQL no está ejecutado todavía.

---

## Sobre el dominio

El sitio está desplegado actualmente en la URL de Vercel (`liz-cabriales.vercel.app`). No hay dominio propio comprado.

### ¿Es lo primero que hay que hacer?

**Sí, comprarlo en la reunión es lo ideal.** Razones:
- Desbloquea Google OAuth, Resend y Supabase Auth de una vez
- Sin dominio esas 3 cosas se configuran a medias y hay que rehacerlas después
- Evita hacer el trabajo dos veces

### Cómo comprarlo

El camino más rápido es directo desde Vercel:  
**Dashboard del proyecto → Settings → Domains → Buy a domain**

- Se compra con tarjeta, queda conectado automáticamente al proyecto
- No hay que tocar DNS manualmente
- Cuesta un poco más que en Namecheap/GoDaddy pero es el proceso más limpio para este caso

### Quién lo compra y quién lo controla

El owner-checklist indica que el dominio debe estar bajo el control de Liz (la dueña). Opciones:

| Opción | Qué implica |
|--------|-------------|
| **Invitar a Liz al proyecto Vercel** y que ella compre con su tarjeta | Rápido, dominio queda a su nombre, sin transferencias |
| DEV compra y Liz reembolsa | Dominio queda en cuenta DEV — hay que transferir después |
| Liz crea cuenta Vercel, se le transfiere el proyecto | Más limpio a largo plazo, más pasos hoy |

**Recomendación:** invitar a la hija de Liz como miembro del proyecto Vercel antes de la reunión. Que ella compre el dominio desde ahí con la tarjeta de Liz. La transferencia formal del ownership del proyecto se puede dejar para después del go-live.

---

## Orden de trabajo recomendado (reunión)

1. Comprar dominio desde Vercel (Liz lo paga con su tarjeta)
2. Ejecutar SQL en Supabase (`sprint5` → `whatsapp`)
3. Conseguir credenciales de MercadoPago PRODUCCIÓN
4. Confirmar datos de negocio (dirección, WhatsApp oficial, Instagram)

---

## Preguntas a resolver en la reunión

- [ ] ¿El WhatsApp `833 218 3399` en el código es el correcto?
- [ ] ¿Tienen dominio en mente o buscan uno ahí mismo?
- [ ] ¿Porcentaje de cargo CFDI con la contadora?
- [ ] ¿Quieren recepcionista habilitada desde el inicio?
- [ ] ¿El teléfono es obligatorio para comprar o sigue opcional?
