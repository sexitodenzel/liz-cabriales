# pages.md

## Contexto previo

### Páginas públicas
- `/` — Landing page / Home
- `/shop` — Tienda de productos
- `/shop/:id` — Detalle de producto
- `/search` — Búsqueda
- `/courses` — Cursos disponibles
- `/courses/:id` — Detalle de curso
- `/booking` — Reserva de citas
- `/favorites` — Productos favoritos del usuario

### Páginas privadas (requieren sesión)
- `/profile` — Perfil del usuario + historial de pedidos, citas y cursos
- `/checkout` — Proceso de pago

### Panel de administrador
- `/admin` — Dashboard general
- `/admin/products` — Gestión de productos
- `/admin/orders` — Gestión de pedidos
- `/admin/appointments` — Gestión de citas
- `/admin/courses` — Gestión de cursos
- `/admin/users` — Gestión de usuarios

---

## To-do (pendiente definir)

- [ ] ¿Habrá página de confirmación post-pago (`/order/confirmation`)?
- [ ] ¿Habrá página de seguimiento de pedido (`/order/:id`)?
- [ ] ¿El carrito es página aparte o modal/sidebar?
- [ ] ¿Habrá página de términos y condiciones o política de privacidad?
- [ ] ¿Habrá página de error 404 personalizada?
- [ ] ¿El login/registro es página aparte o modal?
- [ ] ¿Habrá página de "mis favoritos" o solo es sección dentro del perfil?
- [ ] ¿El admin dashboard tendrá métricas o solo listas (ventas, citas del día, etc.)?
- [ ] ¿Habrá subpáginas dentro de `/profile` (pedidos, citas, cursos por separado)?

---

## Preguntas para la reunión con Liz

1. ¿Quieres una página de confirmación después de comprar o reservar?
2. ¿El carrito lo ves como página aparte o como un panel lateral que se abre sin salir de donde estás?
3. ¿El login lo ves como página aparte o como un popup al intentar hacer algo que requiere cuenta?
4. ¿Quieres que el admin tenga un dashboard con resumen del negocio (ventas del día, citas próximas, cursos activos)?