# Pendiente: Resend (Emails transaccionales)

**Bloquea:** confirmaciones de compra, recordatorios de cita, correos de bienvenida  
**Responsable:** Liz (cuenta y dominio) + Dev (DNS y configuración)

---

## Qué necesita hacer Liz

1. Crear cuenta en [resend.com](https://resend.com) con el email de la empresa (o confirmar que ya existe).
2. Elegir un plan que soporte el volumen estimado de envíos.
3. En Resend → **Domains**, agregar el dominio del salón (ej. `lizcabriales.com`).
4. Resend mostrará registros DNS (SPF, DKIM, DMARC) — pasarlos al Dev.
5. Ir a **Resend → API Keys**, generar una key de producción y enviarla al Dev de forma segura.

---

## Qué hace el Dev (con acceso DNS y la API Key)

1. En el proveedor de dominio de Liz (GoDaddy, Namecheap, etc.), agregar los registros DNS:
   - `TXT` SPF: `v=spf1 include:amazonses.com ~all`
   - `CNAME` DKIM: el que Resend indique (ej. `resend._domainkey`)
   - `TXT` DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@[dominio]`
2. Esperar propagación DNS (puede tardar hasta 48 h; Resend muestra estado "Verified").
3. En **Vercel → Environment Variables**, agregar:
   - `RESEND_API_KEY` = la key de producción
4. En `lib/email/templates/_shared.ts`, cambiar el remitente de:
   - `onboarding@resend.dev` → `hola@[dominio-real]` (o el que Liz defina)
5. Hacer redeploy.

---

## Prueba de aceptación

- [ ] Realizar una compra de prueba → email de confirmación llega a la bandeja del cliente.
- [ ] Email muestra remitente del dominio de marca (no `onboarding@resend.dev`).
- [ ] Email no cae en spam.

---

## Referencias

- RACI sección 5 — Resend
- Owner Checklist sección B (`RESEND_API_KEY`) y C.3
- Checklist pre-lanzamiento → Técnico (líneas Resend)
