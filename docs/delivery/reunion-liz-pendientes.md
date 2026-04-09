# Pendientes para reunión con Liz

> Documento interno de preparación para las reuniones semanales con Liz.
> Actualizar antes de cada reunión.

---

## Reunión próxima — semana del 14 abril 2026

### Demo a mostrar
- Tienda funcionando en producción: https://liz-cabriales.vercel.app/tienda
- Flujo completo: agregar producto → carrito → checkout → MercadoPago
- Panel admin de productos: /admin/products

### Insumos que necesitamos de Liz — BLOQUEADORES

| Insumo | Impacto si no llega |
|---|---|
| Credenciales MercadoPago producción | Sin esto no hay ventas reales |
| Base de datos de productos (Excel con precios) | Sin esto la tienda tiene productos de prueba |
| Fotos reales del negocio y productos | Sin esto las imágenes son placeholders |
| Logos de marcas en PNG/SVG | Sin esto el slider usa placeholders |
| Lista de servicios con precio y duración | Sin esto no arranca módulo de citas |
| Lista de cursos activos con fechas y precio | Sin esto no arranca módulo de cursos |
| % adicional para CFDI con su contadora | Sin esto no hay flujo de facturación |
| Elección de dominio definitivo | Sin esto el sitio vive en vercel.app |

### Decisiones que necesitamos que Liz apruebe

- [ ] ¿Arrancamos Sprint 2 (panel admin de órdenes) esta semana?
- [ ] ¿Cuándo es la visita al negocio para capturar productos?
- [ ] ¿Tiene cuenta de MercadoPago activa con credenciales de producción?
- [ ] ¿Qué dominio quiere usar? (ej. lizcarbriales.com, lizcarbriales.mx)

### Costos recurrentes a explicarle

| Concepto | Costo estimado | Frecuencia |
|---|---|---|
| Dominio | ~$200-400 MXN | Anual |
| Vercel Pro (si crece el tráfico) | ~$400 MXN | Mensual |
| Supabase (si supera plan gratuito) | ~$300 MXN | Mensual |
| Resend (plan gratuito cubre inicio) | $0 por ahora | — |
| MercadoPago comisiones | ~3.49% + IVA | Por venta |

### Agenda sugerida (30 min)

1. Demo de lo construido — 10 min
2. Entrega de insumos pendientes — 10 min
3. Aprobación del siguiente sprint — 5 min
4. Dudas y preguntas — 5 min

---

## Tutoriales pendientes de grabar para Liz

> Grabar cuando se entregue cada fase. Usar Loom.

- [ ] Cómo agregar, editar y desactivar productos desde el admin
- [ ] Cómo ver y gestionar órdenes
- [ ] Cómo cambiar estado de una orden (pagada → enviada → entregada)
- [ ] Cómo ver el inventario
- [ ] Cómo agendar una cita desde el panel (Fase 2)
- [ ] Cómo crear y publicar un curso (Fase 2)

---

## Notas de reuniones anteriores

### 16 marzo 2026
- Alcance completo aprobado — 3 módulos (ecommerce, citas, cursos)
- MercadoPago elegido como pasarela
- Total acordado: $22,000 MXN — anticipo $2,000 MXN entregado
- Ver detalle completo: docs/delivery/meetings/2026-03-16.md