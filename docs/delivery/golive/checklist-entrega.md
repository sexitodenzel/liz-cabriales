# Checklist de entrega — Academia Liz Cabriales

> Para **Denzel** (mantenedor). Pasos técnicos del lanzamiento y la entrega a Liz.
> Modelo acordado: **Denzel mantiene el sitio; Liz solo usa el panel de admin.**

---

## 🔴 FASE 1 — Antes de lanzar (bloqueantes)

Sin esto, la tienda no vende de verdad.

- [ ] **Probar una compra real con MercadoPago** (sandbox → tarjeta de prueba)
  - Recorrido: carrito → checkout → pago → webhook → orden `paid` → correos automáticos
  - Requiere URL pública (Vercel o túnel) porque el webhook **no llega a localhost**
- [ ] **Verificar variables de entorno en Vercel (producción)** — que estén TODAS:
  - `MERCADOPAGO_ACCESS_TOKEN` (producción, empieza con `APP_USR-`)
  - `MERCADOPAGO_WEBHOOK_SECRET` (del dashboard de MP)
  - `RESEND_API_KEY`, `ADMIN_EMAIL`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL` (la URL real del sitio)
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` → **llaves REALES**, no las de prueba
  - `CRON_SECRET`
- [ ] **Cambiar credenciales de MercadoPago a producción** ← ÚLTIMO paso, cuando la compra de prueba pase
  - Liz saca sus credenciales de producción de su cuenta MP y se ponen en Vercel
  - Reconfigurar el webhook en el panel de MP apuntando a `https://<sitio>/api/webhooks/mercadopago`
- [ ] **`ADMIN_EMAIL` = el correo donde Liz quiere recibir alertas** (nueva orden, cita, inscripción)

### Estado verificado (2026-08-01)
- ✅ Resend: dominio `lizcabriales.com` verificado, correos cliente + admin probados y funcionando
- ✅ Base de datos: flujo de compra completo (órdenes, pagos, stock, idempotencia de correo)

---

## 🟢 FASE 2 — Entregar a Liz (rápido)

- [ ] **Crear la cuenta admin de Liz**
  - Vía confiable: Supabase → Table Editor → tabla `users` → fila de Liz → `role` = `admin`
  - (Roles del sistema: `client` | `admin`. Ya no hay recepcionista.)
- [ ] **Carpeta de Google Drive** "Manual Academia Liz Cabriales" con:
  - Links de los Looms (ver `manual-liz.md`)
  - La hoja de referencia rápida (1 página)
- [ ] **Pasarle a Liz:** su login de admin + el link de la carpeta de Drive + tu WhatsApp de soporte
- [ ] **Credenciales de MercadoPago de Liz** → guardar de forma segura (gestor de contraseñas), NUNCA en Drive plano

---

## 🟡 FASE 3 — Features opcionales (no bloquean vender)

Correr en Supabase cuando se quieran activar. Verificado pendiente al 2026-08-01:

- [ ] Facturación CFDI → `docs/delivery/sql/sql-sprint5-supabase.sql` (falta columna `cfdi_use`)
- [ ] Reseñas de producto → `docs/delivery/sql/sql-product-reviews.sql` (falta `verified_purchase`)
- [ ] Collage del home → `sql-home-spotlight.sql` (falta la tabla `home_spotlight`)
- [ ] Varios maestros por curso → `docs/delivery/sql/sql-course-instructors.sql` (verificar tabla `course_instructors`)

---

## 🔵 Inventario de cuentas/servicios (referencia)

| Servicio | Para qué | Dueño / notas |
|---|---|---|
| Dominio `lizcabriales.com` | Dirección web | Ideal a nombre de Liz; DNS lo gestiona Denzel |
| Vercel | Hosting | Denzel (mantenedor) |
| Supabase | Base de datos | Denzel (mantenedor) — proyecto `qlvslouwkiemsjkggdqq` |
| Resend | Correos | Denzel owner; dominio verificado |
| MercadoPago | Pagos | **Liz** (recibe el dinero) |
| Cloudflare Turnstile | Anti-bots | Denzel |
| GitHub | Código | Denzel |
| WhatsApp Business | Avisos (opcional) | Sin configurar (el sitio funciona sin él) |

---

## 💰 Costos mensuales a tener en cuenta

Confirmar con Liz quién paga qué y avisarle antes de que algún plan se quede corto:

| Servicio | Plan actual | Cuándo sube de plan |
|---|---|---|
| Vercel | Hobby (gratis) | Si crece el tráfico → Pro (~$20 USD/mes) |
| Supabase | Free | Si crece la BD/uso → Pro (~$25 USD/mes) |
| Resend | Free (3,000 correos/mes, 100/día) | Si se pasa → plan pagado |
| Dominio | ~$12 USD/año | Renovación anual |
| Turnstile | Gratis | — |

> Nota Vercel: el plan Hobby permite **máximo 1 cron al día**. No agregar crons más frecuentes en `vercel.json` o rompe los deploys en silencio.

---

## 🔧 Modelo de mantenimiento (acordar con Liz)

- **Cómo reporta un problema:** WhatsApp / correo a Denzel
- **Qué incluye:** arreglo de bugs. **Features nuevas se cotizan aparte.**
- **Costos de infraestructura:** ver tabla de arriba; definir quién paga
- **Respaldo:** activar backups automáticos de Supabase si se sube a plan Pro

---

## ⚪ Post-lanzamiento (opcional, sin prisa)

- [ ] **Foto/logo del remitente en correos (BIMI)** — requiere DMARC estricto + logo SVG + certificado VMC pagado (~$1,000 USD/año, y registro de marca). Solo se muestra en Gmail con el certificado. Gratis funciona en Apple Mail. **Recomendación: dejarlo para mucho después.**
- [ ] Mover correos de comprador a la pestaña "Principal" de Gmail (hoy caen en "Compras")
