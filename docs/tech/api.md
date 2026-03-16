# api.md

## Contexto previo

Los endpoints se derivan directamente de los tres pilares del negocio y los flujos documentados. Se listan los confirmados y los anticipados según la arquitectura.

---

### Autenticación
```
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### Productos
```
GET    /products           — catálogo público
GET    /products/:id       — detalle de producto
POST   /products           — crear producto (admin)
PUT    /products/:id       — editar producto (admin)
DELETE /products/:id       — eliminar producto (admin)
```

### Pedidos
```
POST   /orders             — crear pedido (checkout)
GET    /orders             — ver todos los pedidos (admin)
GET    /orders/:id         — detalle de pedido
PATCH  /orders/:id/status  — actualizar estado (admin)
```

### Citas
```
GET    /appointments                — ver citas del usuario
GET    /appointments/admin          — ver todas las citas (admin)
POST   /appointments                — crear cita
PATCH  /appointments/:id/cancel     — cancelar cita
GET    /appointments/availability   — horarios disponibles por fecha
```

### Servicios
```
GET    /services           — lista de servicios disponibles
POST   /services           — crear servicio (admin)
PUT    /services/:id       — editar servicio (admin)
DELETE /services/:id       — eliminar servicio (admin)
```

### Cursos
```
GET    /courses            — cursos disponibles (público)
GET    /courses/:id        — detalle de curso
POST   /courses            — crear curso (admin)
PUT    /courses/:id        — editar curso (admin)
DELETE /courses/:id        — eliminar curso (admin)
```

### Inscripciones a cursos
```
POST   /course-registrations            — inscribirse a curso
GET    /course-registrations/admin      — ver inscritos (admin)
GET    /course-registrations/user       — cursos del usuario
DELETE /course-registrations/:id        — cancelar inscripción
```

### Usuarios
```
GET    /users              — ver todos los usuarios (admin)
GET    /users/:id          — perfil de usuario
PATCH  /users/:id          — editar perfil
```

---

## To-do (pendiente definir)

- [ ] ¿Se usan API Routes de Next.js o servidor Node separado? — ver `architecture.md`
- [ ] ¿Los pagos tienen su propio endpoint o se manejan dentro de `/orders`?
- [ ] ¿Habrá webhook del proveedor de pagos para confirmar transacciones?
- [ ] ¿Habrá endpoint para bloquear horarios desde el admin?
- [ ] ¿Habrá endpoint para agregar alumnos manualmente a un curso?
- [ ] Definir proveedor de pagos — afecta estructura de endpoints de pago