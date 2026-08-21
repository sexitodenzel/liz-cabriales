# Entrega — Academia y Salón Liz Cabriales

> **Punto de entrada único** para la reunión de entrega. Todo lo relevante está enlazado
> desde aquí. Si un dato de estado se contradice con otro doc, manda **`ESTADO.md`**.

Modelo acordado: **Denzel mantiene el sitio; Liz solo usa el panel de admin.**

---

## 🟢 Estado del lanzamiento (empezar aquí)

- **[PENDIENTES.md](PENDIENTES.md)** — tracker único: TODO lo que falta antes de lanzar
  (técnico, configuración por servicio, contenido, negocio y entrega), en una sola lista.
- **[ESTADO.md](ESTADO.md)** — fuente única de verdad. Qué está hecho y comprobado, qué
  bloquea vender, qué falta de verdad y cuotas a vigilar. Cada línea dice cómo se verificó.

## 👤 Para Liz / la reunión con la clienta

- **[para-liz-hija.md](para-liz-hija.md)** — qué necesitamos de su lado para lanzar (dominio,
  MercadoPago, Google, Resend, WhatsApp, Instagram) con el orden y tiempos.
- **[costos-operacion-y-whatsapp.pdf](costos-operacion-y-whatsapp.pdf)** — costos de operación
  (Vercel, Supabase, Resend, dominio), comisión de MercadoPago y las 3 opciones de WhatsApp.
  *(Fuente editable: `costos-operacion-y-whatsapp.html`.)*
- **[manual-liz.md](manual-liz.md)** ([PDF](manual-liz.pdf)) — manual de uso del panel admin.
- **[notas-entrega-explicacion.md](notas-entrega-explicacion.md)** — walk-through de features a
  demostrar en vivo (hoy: flujo de facturación CFDI).
- **[notas-reunion-dominio.md](notas-reunion-dominio.md)** — notas de la reunión sobre el dominio.

## 🔧 Para el mantenedor (Denzel)

- **[checklist-entrega.md](checklist-entrega.md)** — pasos técnicos del lanzamiento y la
  entrega a Liz (variables Vercel, cuenta admin, credenciales MP).
- **[delivery-launch-plan.md](../delivery-launch-plan.md)** — plan maestro operativo: matriz
  **RACI**, gate go-live, riesgos y **anexo técnico** (specs de las 7 plantillas de WhatsApp,
  pasos de Google OAuth, crons, buckets de Storage). *Nota: menciona el rol "recepcionista",
  que ya fue eliminado del sistema — ignorar esas filas.*
- **[../sql/README.md](../sql/README.md)** — índice de los scripts SQL con su estado
  (corridos / pendientes / verificar).

## ⏳ Pendientes por servicio

Cada uno explica qué necesita hacer Liz y qué hace el Dev:

- [Dominio + Vercel](../pendientes/vercel-dominio.md)
- [MercadoPago](../pendientes/mercadopago.md)
- [Supabase](../pendientes/supabase.md)
- [Resend](../pendientes/resend.md)
- [Google OAuth](../pendientes/google-oauth.md)
- [WhatsApp Business](../pendientes/whatsapp-business.md)
- [Instagram](../pendientes/instagram.md)
- [Datos del negocio](../pendientes/datos-negocio.md)

## 📄 Gobernanza / contrato

- [Acuerdo de servicio](../delivery-acuerdo-servicio.md) — alcance, cobros, mantenimiento.
- [Decisions log](../delivery-decisions-log.md) — registro de decisiones clave con Liz.
- [Project charter](../delivery-project-charter.md) — documento fundacional (alcance, fases, financiero).

## 🛠️ Referencia técnica

- [Cron de limpieza](../cron-cleanup-pending.md) — cancelación de órdenes/citas/inscripciones abandonadas.
- [Entrega a domicilio local](../local-delivery.md) — feature de repartidor local.
- [Plantillas de correo de Supabase Auth](../supabase-auth-emails/README.md) — versiones de marca.
