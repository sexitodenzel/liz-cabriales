
## Contexto previo

### Flujo de compra de producto
1. Usuario entra al sitio
2. Navega a la sección de productos (o cursos o citas desde el nav principal)
3. Selecciona producto y lo agrega al carrito
4. Procede al checkout
5. Paga con pasarela de pagos
6. Recibe confirmación por correo

### Flujo de reserva de cita
1. Usuario hace click en la sección de citas desde el landing
2. Elige si la cita es individual o en grupo
3. Se muestran los servicios disponibles ordenados
4. Selecciona uno o varios servicios (se guardan en carrito)
5. Selecciona fecha — solo muestra días con disponibilidad
6. Selecciona hora disponible en esa fecha
7. Elige profesional: opción default "cualquier profesional" o elige uno específico
8. Sistema solicita inicio de sesión o registro si no está autenticado
9. Confirmación de reserva + correo de confirmación

### Flujo de inscripción a curso
1. Usuario entra a la sección de cursos
2. Ve los cursos disponibles
3. Selecciona un curso
4. Indica cuántas personas asistirán
5. Flujo similar a reserva de cita: selección → pago → confirmación
6. Recibe correo de confirmación con detalles del curso

### Flujo de registro / login
Pendiente definir según proveedor de autenticación (Google OAuth o Supabase Auth nativo). El flujo se activa cuando el usuario intenta realizar una acción que requiere cuenta (comprar, reservar, inscribirse).

### Flujo admin — crear producto
Sin definir. Se diseñará con apoyo de IA considerando mejores prácticas de panel admin para ecommerce.

### Flujo admin — ver citas
Sin definir. Se diseñará con apoyo de IA considerando vista de agenda/calendario con filtros por fecha, profesional y estado de la cita.

---

## To-do (pendiente confirmar con Liz)

- [ ] ¿Confirmar proveedor de autenticación (Google o Supabase)?
- [ ] ¿Las citas en grupo tienen precio diferente al individual?
- [ ] ¿Cuántas personas máximo en una cita grupal?
- [ ] ¿El usuario puede agregar varios servicios en una misma cita o es uno por cita?
- [ ] ¿El carrito de citas y el carrito de productos son el mismo o flujos separados?
- [ ] ¿El pago de cita y de producto pueden ir juntos en un solo checkout?

---

## Preguntas para la reunión con Liz

1. ¿Las citas grupales tienen precio diferente o cada persona paga su parte individualmente?
2. ¿Cuántas personas máximo pueden venir en una cita grupal?
3. ¿Un cliente puede reservar más de un servicio en la misma cita (por ejemplo uñas + podología)?
4. ¿Quieres que alguien pueda comprar un producto y reservar una cita en el mismo checkout, o son flujos completamente separados?
5. ¿El login aparece al final del flujo (antes de confirmar) o al inicio?