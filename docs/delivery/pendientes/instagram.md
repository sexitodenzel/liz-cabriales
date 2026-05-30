# Pendiente: Instagram / Meta Graph API (Feed en landing)

**Bloquea:** el feed de Instagram visible en la página de inicio  
**Responsable:** Liz (acceso a cuenta y token inicial) + Dev (env var y cron)

---

## Contexto

La landing muestra las publicaciones recientes de Instagram de Liz vía la Graph API de Meta.  
Los tokens de acceso de Instagram expiran cada 60 días — hay un cron configurado que los renueva automáticamente.  
Lo que falta es el token inicial y confirmar que el cron funciona.

---

## Qué necesita hacer Liz

1. Confirmar acceso a su cuenta de **Meta for Developers** ([developers.facebook.com](https://developers.facebook.com)).
2. En la app de Meta (la misma que se usa para WhatsApp Business, o una dedicada para Instagram):
   - Obtener un **token de acceso long-lived** para la cuenta de Instagram profesional.
   - El proceso: obtener token corto de usuario → canjearlo por token long-lived (válido ~60 días).
3. Enviar el token long-lived inicial al Dev de forma segura.

---

## Qué hace el Dev

1. En **Vercel → Environment Variables**, agregar:
   - `INSTAGRAM_ACCESS_TOKEN` = token long-lived inicial
2. Verificar que el cron de renovación está configurado en `vercel.json`:
   - Endpoint: `/api/cron/refresh-instagram-token`
   - Frecuencia: mensual (antes de los 60 días de expiración)
3. Probar que el cron responde `200 OK` con `CRON_SECRET` correcto.
4. Verificar en la landing que el feed muestra publicaciones reales.

---

## Prueba de aceptación

- [ ] Feed de Instagram visible en la home con publicaciones reales (no placeholder/vacío).
- [ ] Endpoint de cron responde correctamente: `GET /api/cron/refresh-instagram-token` con el header `Authorization: Bearer [CRON_SECRET]`.
- [ ] Después del primer mes: token renovado automáticamente sin intervención manual.

---

## Notas

- Si la cuenta de Instagram de Liz aún no está como **cuenta profesional** (Creator o Business), debe cambiarse desde la app de Instagram antes de poder usar la API.
- El token NUNCA debe compartirse por WhatsApp o email sin cifrar — usar un gestor de contraseñas o Vercel directamente.

---

## Referencias

- RACI sección 6 — Instagram / Meta
- Owner Checklist sección A (Meta/Instagram) y B (`INSTAGRAM_ACCESS_TOKEN`)
- Checklist pre-lanzamiento → Técnico (Instagram: token inicial + cron)
- delivery-launch-plan.md §5 (Instagram token flow)
