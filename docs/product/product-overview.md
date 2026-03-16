
## Contexto previo

El producto es una plataforma web integral para la academia/salón Liz Cabriales que combina tres sistemas en uno:

1. **Ecommerce** — tienda online de productos para uñas, pestañas y accesorios. Modelo similar a Shopify. Ventas a nivel nacional.
2. **Sistema de reservas** — dos tipos: citas para servicios de aplicación de uñas (local) y registro de asistencia a cursos/talleres (local, cuando hay disponibles).
3. **Gestión de cursos presenciales** — no es una plataforma de cursos online. Todo es presencial.

Todo el contenido de los cursos es presencial; el sitio solo gestiona inscripción, pago y asistencia.

**Funcionalidades del cliente:**
- Comprar productos
- Agendar citas de servicios
- Registrarse a cursos/talleres disponibles
- Ver historial de compras (para repetir pedidos)

**Funcionalidades del administrador:**
- Tienda: agregar/eliminar productos, ver órdenes, autorizar compras
- Cursos: ver lista de asistentes, administrar inscripciones
- Citas: ver todas las citas activas con sus horarios, sin permitir traslapes

**Autenticación:**
- Se requiere cuenta para realizar cualquier acción (comprar, agendar, inscribirse)
- Login con Google o con Supabase Auth — aún sin decidir

---

## To-do (pendiente confirmar con Liz)

- [ ] ¿Google login, Supabase Auth nativo, o ambas opciones?
- [ ] ¿El admin puede tener múltiples usuarios con distintos permisos (Liz + staff)?
- [ ] ¿El historial incluye solo compras o también citas y cursos?
- [ ] ¿Qué significa "autorizar compras" — hay compras que requieren aprobación manual?

---

## Preguntas para la reunión con Liz

1. ¿Prefieres que el cliente pueda entrar con Google o que cree usuario y contraseña en el sitio?
2. ¿Solo tú manejas el admin o también alguien de tu equipo necesita acceso?
3. ¿Quieres que el cliente pueda ver el historial de sus citas y cursos además de sus compras?
4. Mencionaste "autorizar compras" — ¿hay pedidos que necesitan tu aprobación antes de confirmarse, o es automático al pagar?