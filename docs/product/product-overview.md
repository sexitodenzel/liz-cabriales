# product-overview.md

## Qué es el producto

Plataforma web integral para la academia/salón Liz Cabriales que combina tres sistemas:

1. **Ecommerce** — tienda online de productos para uñas, pestañas y podología. Ventas a nivel nacional.
2. **Sistema de citas** — reserva de servicios del salón (local). Pago adelantado al reservar.
3. **Gestión de cursos presenciales** — inscripción, pago y control de asistencia. Todo presencial, no hay cursos online.

---

## Funcionalidades del cliente

- Comprar productos y rastrear pedidos
- Agendar citas de servicios desde la app
- Registrarse a cursos/talleres disponibles
- Ver historial de compras, citas y cursos
- Solicitar factura (CFDI) al momento de compra — opcional, con cargo adicional

---

## Funcionalidades del administrador

Ver `admin/admin-permissions.md` para detalle completo.

### Tienda
- CRUD de productos
- Ver y gestionar pedidos
- Envíos con guías DHL

### Cursos
- Crear, editar y cancelar cursos
- Ver lista de asistentes
- Agregar alumnos manualmente (pagos fuera del sitio)

### Citas
- Ver agenda completa sin traslapes
- Crear citas manualmente (clientes que llaman por teléfono)
- Cancelar citas
- Bloquear horarios (vacaciones, días sin servicio)

---

## Autenticación

- Email/password activo (Supabase Auth)
- Google OAuth — pendiente implementar
- Se requiere cuenta para comprar, agendar o inscribirse
- Roles: `client`, `admin`, `receptionist` (pendiente implementar receptionist)

---

## Política de cambios y devoluciones

- **No existen reembolsos** — no sale dinero bajo ninguna circunstancia
- Cambio por otro producto solo si: menos de 3 días y producto sin usar
- Productos usados: sin cambio ni devolución
- No hay sistema de apartado
- Debe reflejarse en Términos y Condiciones del sitio

---

## Carrito e inventario

- Carrito híbrido: guest en localStorage, usuario autenticado en Supabase
- Merge automático al hacer login
- Inventario sincronizado: ventas locales y online actualizan el mismo stock
- Citas híbridas: se agendan desde la app o desde el local (recepcionista en panel admin)

---

## Facturación

- Mayoría de clientes no factura
- Clientes que solicitan CFDI: checkbox opcional en checkout
- Se captura RFC + razón social
- Se aplica % adicional definido por la contadora de Liz
- El CFDI lo emite la contadora — el sistema solo registra la solicitud

---

## Pendientes de confirmar con Liz

- [ ] ¿El historial del cliente incluye solo compras o también citas y cursos?
- [ ] ¿Las compras se confirman automáticamente al pagar o requieren aprobación manual?
- [ ] % exacto del cargo por facturación
- [ ] Definición exacta de permisos del rol recepcionista