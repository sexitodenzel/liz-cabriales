# backlog.md

## Features pendientes para fases posteriores

---

### Ecommerce
- Página de detalle de producto /tienda/[slug]
- Checkout completo
- Integración MercadoPago (pasarela elegida)
- Cupones de descuento
- Promociones y precios especiales
- Productos destacados automáticos por ventas
- Mayoreo — precios por volumen
- Importación de base de datos de productos de Liz

---

### Ventas y marketing
- Google Ads — integración y gestión (cobro mensual a Liz)
- Meta Ads — integración y gestión (cobro mensual a Liz)
- Integración con Instagram — galería UGC conectada al feed real

---

### Experiencia del usuario
- Reviews y calificaciones de productos
- Lista de favoritos persistente (tabla favorites ya existe en DB)
- Notificaciones push
- Seguimiento de pedido en tiempo real
- Google OAuth

---

### Administración
- Niveles de admin — admin completo y recepcionista (permisos diferenciados)
- Sincronización de inventario — ventas locales y online actualizan el mismo stock
- Citas híbridas — recepcionista agenda desde el panel, no solo desde la app
- Gestión de pedidos
- Gestión de usuarios
- Analytics — ventas, citas, cursos, usuarios
- Reportes exportables
- Dashboard con métricas del negocio

---

### Cursos
- Certificados digitales
- Niveles de curso estructurados
- Confirmación por correo al inscribirse

---

### Citas
- Sistema de booking desde la app
- Panel admin — gestión de agenda sin traslapes

---

### Pagos
- 6 meses sin intereses (MercadoPago lo soporta nativamente)
- Facturación electrónica (CFDI) — opcional por cliente, % adicional definido por contadora de Liz
- Flujo: checkbox "¿Requieres factura?" en checkout → captura RFC + razón social → cargo adicional informado → gestión con contadora

---

### Técnico
- SEO avanzado
- Optimización de imágenes con Supabase Storage
- Tests automatizados
- Deployment en producción (Vercel)
- Eliminar console.logs de debug antes de producción

---

## To-do pendiente confirmar con Liz
- [ ] Recibir base de datos completa de productos con precios
- [ ] Recibir fotos reales del negocio, productos y cursos
- [ ] Recibir logos de marcas en PNG/SVG
- [ ] Respuestas al cuestionario enviado por WhatsApp
- [ ] Confirmar % adicional por facturación con su contadora
- [ ] Confirmar cuántos niveles de admin necesitan exactamente
- [ ] Confirmar si cupones y mayoreo entran en MVP o después
- [ ] Confirmar fecha de lanzamiento objetivo