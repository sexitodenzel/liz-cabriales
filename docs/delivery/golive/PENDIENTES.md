# Pendientes — Recta final al lanzamiento

> **Tracker único.** Lo que realmente falta antes de dar por entregado el sitio.
> Verificado contra el código y la base de datos real el **2026-08-12**.
> Estado técnico detallado en [`ESTADO.md`](ESTADO.md).
>
> Etiquetas: **(Liz)** dueña · **(Dev)** Denzel · **(Liz+Dev)** juntos.

---

## 🔴 1. Bloqueante para vender

- [ ] **Cerrar la primera compra E2E de productos con MercadoPago.** Ya hay una orden real en
      curso (cliente pagando envío), o sea que MP **ya cobra en producción**; falta confirmar el
      flujo completo de punta a punta una vez. **(Dev)**

> Decisión del dueño: **no se rotan** el access token ni el webhook secret por ahora.

---

## 🟡 2. Técnico pendiente (Dev)

- [ ] **Google OAuth** — publicar la app (salir de "Testing"), branding/logo, agregar dominio en
      orígenes + redirect URIs, y confirmar Supabase Auth URL Configuration con el dominio real.
      → [`../pendientes/google-oauth.md`](../pendientes/google-oauth.md)
- [ ] **Instagram** — generar el token long-lived inicial y verificar que el cron de renovación
      responde 200. → [`../pendientes/instagram.md`](../pendientes/instagram.md)
- [ ] **`robots.txt` y `sitemap.xml`** — no existen (verificado). Carencia real de SEO para el lanzamiento.

---

## 🔌 3. WhatsApp Business (opcional — 2ª etapa)

El sitio funciona sin esto. Toda la base de datos ya está lista (columnas de teléfono, TUA y
`notification_log` corridas). Falta lo externo + una pantalla:

- [ ] Cuenta Meta Business, número dedicado, plantillas aprobadas, env vars y método de pago en Meta.
      Costos en [`costos-operacion-y-whatsapp.pdf`](costos-operacion-y-whatsapp.pdf) · guía en
      [`../pendientes/whatsapp-business.md`](../pendientes/whatsapp-business.md)
- [ ] **Pantalla para verificar teléfono** — el backend existe (`/api/phone/send-code`,
      `verify-code`) pero ninguna pantalla lo llama (verificado). Sin esto los WhatsApp a clientes
      no salen. Solo se necesita si se activa WhatsApp. **(Dev)**

---

## 📝 4. Contenido y negocio (Liz)

Los datos de contacto, el % de CFDI (16%) y el catálogo (975 productos, 110 cursos, 17 servicios)
**ya están cargados y verificados.** Falta:

- [ ] **Política de cancelaciones y reembolsos** definida y publicada (requisito PROFECO). **(Liz)**
- [ ] **Aumento de precios de productos** para absorber los gastos operativos (comisión MP ~4.36% +
      infraestructura ~0.7% ≈ **~5% total**). Mecanismo: correr un script que sube todo el catálogo
      ese % de una vez (no es recurrente). Detalle en
      [`costos-operacion-y-whatsapp.pdf`](costos-operacion-y-whatsapp.pdf) sección 5. **(Dev, aprueba Liz)**
- [ ] **Fotos faltantes en Servicios** — un par de servicios sin foto propia (Admin → Citas →
      Servicios), muestran recuadro genérico mientras tanto. **(Liz/Mildred)**

---

## 💼 5. Entrega y operación (Denzel + Liz)

- [ ] **Tutoriales de uso** (Looms) del panel admin, junto con [`manual-liz.md`](manual-liz.md). **(Dev)**
- [x] **Costo de mantenimiento mensual definido:** $990 MXN/mes fijo (arreglo de lo que sea que
      falle: caídas, errores, pagos que no procesan) + $150 MXN/hora cambios y programación
      (contenido, features chicas). Features nuevas grandes se cotizan aparte por proyecto.
      Primer mes sin cobro de mantenimiento (solo el pago final de desarrollo). La infraestructura
      (Vercel/Supabase/dominio, ~$800–900 MXN/mes si se pasa a plan de pago) la paga Liz, aparte
      de este monto. Detalle en [`costos-operacion-y-whatsapp.pdf`](costos-operacion-y-whatsapp.pdf). **(Liz+Dev)**
- [ ] **Documentos legales actualizados** — términos y condiciones, aviso de privacidad y la
      política de cancelaciones. **(Dev/Liz)**
- [ ] **Documentación técnica del código** — para que un desarrollador futuro pueda retomar el
      proyecto sin depender de Denzel. **(Dev)**
- [ ] **Entrega formal a Liz**: cuenta **admin** en producción, carpeta de Drive con los tutoriales,
      y sus credenciales de MercadoPago en un gestor seguro. → [`checklist-entrega.md`](checklist-entrega.md) **(Dev)**

---

## 📅 6. Reunión

- [ ] **Agendar la reunión de entrega con Liz**: presentar costos, definir mantenimiento, aprobar el
      aumento de precios y ejecutar juntos la config que necesita sus accesos (Google, Instagram). **(Liz+Dev)**

---

## ✅ Ya hecho y verificado (2026-08-12)

- Sitio publicado en `lizcabriales.com` con SSL; MercadoPago **cobrando en producción**.
- Correos: dominio verificado en Resend, SMTP de Supabase Auth vía Resend, plantillas de marca, bienvenida, OTP por correo.
- CAPTCHA (Turnstile) con llaves reales exigido por Supabase.
- **Todos los scripts SQL corridos** (WhatsApp/TUA, CFDI/OAuth trigger, título e instructores de curso,
  chips, tipo de evento, descripción breve, entrega a domicilio local). Ver [`../sql/README.md`](../sql/README.md).
- **Catálogo real cargado:** 975 productos, 110 cursos, 17 servicios, 27 categorías, 6 posts de blog.
- Datos de contacto reales (dirección Cd. Madero, WhatsApp 833 218 3399) y CFDI al 16%.
- Guarda de pago corto en el webhook + correos con `await` (no se pierden).
