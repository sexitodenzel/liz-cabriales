# admin-permissions.md

## Roles de administrador

Hay más de un admin. Existen al menos dos niveles de acceso:
- **Admin completo** (Liz y equipo de confianza) — acceso total
- **Recepcionista** (staff) — acceso limitado a citas y agenda

Definición exacta de permisos por rol pendiente de confirmar con Liz.

---

## Permisos confirmados — Admin completo

### Productos
- Crear productos
- Editar productos
- Eliminar productos (soft delete)

### Cursos
- Crear y publicar cursos
- Editar o cancelar un curso ya publicado
- Ver lista de alumnos inscritos
- Agregar alumnos manualmente a un curso (para pagos fuera del sitio — efectivo, transferencia directa, organizaciones)

### Citas
- Ver todas las citas agendadas
- Cancelar citas
- Crear citas manualmente para clientes que llamen por teléfono
- Bloquear horarios en la agenda (vacaciones, días sin servicio)

### Pedidos
- Ver todos los pedidos
- El estado del pedido NO se modifica manualmente desde el panel — el flujo es automático
- Envíos: se manejan con guías DHL; si el pedido es pequeño, la guía se regala al cliente

### Reembolsos
- **No existen reembolsos** — no sale dinero bajo ninguna circunstancia
- Si el cliente lleva menos de 3 días y el producto no ha sido usado, se puede hacer un cambio por otro producto de igual valor
- Productos usados (uña pintada, servicio aplicado): sin cambio ni devolución
- No hay sistema de apartado
- Esto debe reflejarse en los Términos y Condiciones del sitio

---

## Permisos pendientes de definir

- [ ] Qué secciones ve el rol recepcionista exactamente
- [ ] ¿La recepcionista puede ver pedidos o solo citas?
- [ ] ¿La recepcionista puede agregar alumnos a cursos?
- [ ] Número exacto de personas que tendrán acceso admin

---

## Notas técnicas

- El schema actual tiene `role: 'client' | 'admin'` — hay que agregar `'receptionist'` o manejar sub-roles
- La tabla `users` necesita un campo adicional o una tabla `admin_permissions` para granularidad de permisos
- Las API routes de admin ya validan `role = 'admin'` — habrá que extender para manejar recepcionista
- Citas creadas manualmente por recepcionista deben registrarse igual que las del cliente en la tabla `appointments`
- Bloqueo de horarios usa la tabla `blocked_slots` que ya existe en el schema