# stack.md

## Contexto previo

### Frontend
- **Next.js** — framework principal
- **React** — base del frontend (incluido en Next.js)

### Backend
- **Node.js** — servidor y lógica de negocio

### Base de datos y servicios
- **Supabase** — base de datos (PostgreSQL), storage y servicios en tiempo real

### Autenticación
- **Supabase Auth** — manejo de sesiones y usuarios
- **Google OAuth** — login con Google habilitado

### Pagos
- Proveedor sin definir — ver `payments/proveedorpagos.md`

### Deployment
- Sin definir

---

## To-do (pendiente confirmar o definir)

- [ ] ¿Dónde se despliega el proyecto (Vercel, Railway, otro)?
- [ ] ¿Se usará TypeScript o JavaScript?
- [ ] ¿Se usará algún ORM o se consulta Supabase directo con su SDK?
- [ ] ¿Se usará alguna librería de UI (Shadcn, Tailwind, otro)?
- [ ] ¿Se usará algún sistema de emails transaccionales (Resend, SendGrid, otro)?
- [ ] Definir proveedor de pagos

---

## Decisiones técnicas pendientes

Estas decisiones afectan directamente la arquitectura y deben resolverse antes de comenzar el vibecoding:

1. **Proveedor de pagos** — bloquea `commerce/order-flow.md` y `payments/proveedorpagos.md`
2. **Deployment** — afecta configuración de variables de entorno y build
3. **TypeScript vs JavaScript** — afecta toda la base de código
4. **Librería de UI** — afecta estructura de componentes y diseño
5. **Emails transaccionales** — necesario para confirmaciones de citas, cursos y pedidos