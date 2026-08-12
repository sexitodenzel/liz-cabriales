# Estado real del lanzamiento — verificado 2026-08-09

> Fuente única de verdad. Los otros checklists venían mintiendo (marcaban como
> pendientes cosas hechas hacía semanas), y el estado vivía en chats que se
> pierden. Aquí cada línea dice **cómo** se comprobó, para poder re-verificarla
> sin creerle a nadie.

---

## ✅ Hecho y comprobado

| Qué | Cómo se comprobó |
|---|---|
| Sitio publicado en el dominio real | `curl https://lizcabriales.com/login` → 200 |
| Turnstile con llaves REALES en prod | Site key `0x4AAAAAAD6na65JFEpIS8G4` leída del bundle. No es la de prueba (`1x0000…`) |
| SMTP de Supabase Auth con Resend | Panel: `smtp.resend.com:465`, remitente `notificaciones@lizcabriales.com` |
| Dominio verificado en Resend | El correo de registro llegó de verdad el 2026-08-09. Si el dominio no estuviera validado, Resend habría rechazado el envío |
| Plantilla OTP con `{{ .Token }}` | Panel + registro completado de punta a punta |
| Las 6 plantillas de auth con la marca | Pegadas en el panel. Copia versionada en `docs/delivery/supabase-auth-emails/` |
| Correo de bienvenida al registrarse | Ruta `app/api/auth/welcome/route.ts`, disparada desde `/registrar` |
| CAPTCHA exigido por Supabase | `curl` sin token a `/auth/v1/otp`, `/token?grant_type=password` y `/recover` → los tres `captcha_failed`. Login por navegador sigue funcionando |
| Alerta CRITICAL `nail_art_posts_public` | Falsa alarma: la vista filtra `is_active = true AND status = 'approved'`. Además no la usa nadie → ver `docs/delivery/sql-nail-art-view-cleanup.sql` |
| SQL de facturación, reseñas y collage | El usuario los corrió el 2026-08-09 |
| Import duplicado en los 5 megamenús | **Ya no existe**: 1 import + 1 uso por archivo. `tsc --noEmit` sale en 0 y `npm run build` pasa |

---

## 🔴 Bloqueante para vender

- [ ] **Compra E2E real con MercadoPago.** Producto barato, cuenta MP distinta a
      la de Liz. Es lo único que confirma que el webhook llega y la orden pasa a
      `paid`. Requiere el sitio publicado (el webhook no llega a localhost).
- [ ] **Rotar el access token y el webhook secret** una vez que pase la prueba.

Antes de probar con dinero real, confirmar en Vercel (no se pueden leer desde
fuera; son secretos de servidor):

- [ ] `MERCADOPAGO_ACCESS_TOKEN` empieza con `APP_USR-` — si queda en `TEST-`,
      el sitio se ve normal y **nunca cobra**
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` del entorno productivo
- [ ] `NEXT_PUBLIC_APP_URL` con el dominio real — si está mal, MP nunca notifica
      y todo se queda en `pending`
- [ ] `CRON_SECRET`

---

## 🟡 Pendiente de verdad

- [ ] **Supabase → Authentication → URL Configuration** con `https://lizcabriales.com`
      (Site URL + `/auth/callback`). No se puede leer por API; hay que mirarlo.
- [ ] **Falta la pantalla para verificar teléfono.** El backend está completo
      (`app/api/phone/send-code`, `verify-code`) pero **ninguna pantalla lo llama** —
      comprobado con grep sobre `app/` y `components/`. Como
      `lib/notifications/order-notifications.ts` exige `phone_verified`, los
      WhatsApp a clientes **nunca se envían**. Falta solo el front.
- [ ] **`localhost` en los dominios del widget de Cloudflare Turnstile.** Sin esto
      no se puede desarrollar en local (el `.env.local` ya tiene las llaves reales).
- [ ] **Probar el reto interactivo de Cloudflare** ("no soy un robot") en
      producción. El código lo contempla pero no se pudo reproducir en local.
- [ ] **Rotar `TURNSTILE_SECRET_KEY`** (quedó escrita en un chat el 2026-08-09).
      Al rotarla hay que actualizarla en **dos** lugares: Vercel y
      Supabase → Attack Protection → Captcha secret.
- [ ] **No hay `robots.txt` ni `sitemap.xml`.** No existen ni en `app/` ni en
      `public/`. Para un lanzamiento con SEO es una carencia real.
- [ ] Correr `docs/delivery/sql-nail-art-view-cleanup.sql` (sin prisa).
- [ ] Entrega a Liz: cuenta admin, carpeta de Drive, credenciales guardadas.
- [ ] WhatsApp Business e Instagram: sin configurar. El sitio funciona sin ellos.

---

## 👁️ Cuotas a vigilar

| Servicio | Estado 2026-08-09 | Qué pasa al toparse |
|---|---|---|
| Vercel — Fluid Active CPU | 3h 55m / 4h | Las funciones se degradan: incluye checkout y pagos |
| Vercel — Image Optimization | 5.1K / 5K (topado) | **Sin efecto**: `next.config.ts` tiene `unoptimized: true`, Vercel ya no transforma imágenes |
| Supabase — egreso | 2.8 / 5 GB | — |
| Supabase — Disk IO budget | por agotarse | La velocidad de disco baja a su base |

---

## 🧪 Guion de pruebas de pago (pendiente de ejecutar)

1. Retiro en local, sin factura, producto barato
2. Con envío → cotizar desde el panel → pagar el segundo cobro
3. Con factura CFDI — el monto en MP debe coincidir con el pedido
4. Pago cancelado desde la pantalla de MP
5. Cerrar la pestaña a media compra
6. Probar el botón "Verificar pago en MercadoPago" del panel **antes** de necesitarlo

---

## 🐛 Deuda conocida (no bloquea, decidido no arreglar por ahora)

- ~~El webhook no compara `transaction_amount` contra el total esperado.~~
  **ARREGLADO 2026-08-09.** `creditApprovedOrder` recibe el monto que reporta
  MercadoPago y aborta si no cubre `orders.total`; el segundo cobro compara
  contra `shipping_amount_final`. Una orden con pago corto se queda en
  pendiente, sin descontar stock ni mandar confirmación, y el panel explica el
  descuadre con las dos cifras. Regla probada en 11 casos borde.

  Contexto para no malinterpretarlo: **hoy ningún camino modifica `orders.total`
  después de crear la orden** (el recargo CFDI se guarda dentro del total desde
  el inicio, ver `lib/supabase/orders.ts:441`), y el monto lo lee el webhook de
  la API de MercadoPago, no del cuerpo de la petición, así que no se puede
  falsificar. O sea que es **defensa en profundidad**, no el cierre de un agujero
  explotable hoy: cubre pagos parciales y cualquier camino futuro que sí llegue a
  mutar el total. El del envío sí protege un caso real: recotizar después de
  mandar el link.

  Trampa de columnas: el segundo cobro va contra `shipping_amount_final`, que es
  lo que escribe la cotización del panel. `shipping_cost` vale 0 en este flujo —
  compararlo contra esa columna hace que la guarda acepte cualquier importe.
- ~~Correos que se perdían sin dejar rastro.~~ **ARREGLADO 2026-08-11.**
  En Vercel la instancia se congela al devolver la respuesta, así que una
  promesa lanzada sin `await` se muere a medias: el correo no sale y el
  `.catch()` ni siquiera alcanza a loguear. Se detectó en la prueba E2E — la
  cotización de envío se guardaba, el link se generaba, y al cliente nunca le
  llegaba el correo para pagarlo; sin rastro en Resend ni en los logs.
  Corregido en 9 sitios. **Regla para el futuro: en una ruta de API nunca
  lanzar un envío sin `await`** (o `Promise.allSettled` si son varios).
- Doble pago de la misma orden no se detecta ni alerta.
- `deductStockForOrder` lee y escribe sin transacción (poco probable en este volumen).
- `/api/payments/course` no falla cerrado si el insert en `payments` falla.
- `/citas` sigue creando cobros reales por MP aunque el proceso oficial es manual.
  No está enlazado, pero es accesible por URL.
