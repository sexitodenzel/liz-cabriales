# Lo que necesitamos de tu lado para lanzar el sitio

Hola, este documento es para que tengas claro qué cosas necesitamos de ustedes (Liz y tú) para poder publicar el sitio y dejarlo funcionando de verdad.

No te preocupes — te iremos guiando paso a paso en cada una. Este doc es solo para que sepas de antemano qué viene, para qué sirve cada cosa y por qué es necesario.

---

## 1. Dominio (la dirección del sitio)

**Qué es:** El nombre con el que la gente va a encontrar el sitio, por ejemplo `lizcabriales.com` o `studiocabriales.mx`.

**Por qué lo necesitamos:** Hoy el sitio tiene una dirección provisional que pone Vercel (la plataforma donde está hospedado). Muchas cosas — como el login con Google, los correos automáticos y los pagos — necesitan una dirección real y tuya para funcionar correctamente.

**Qué tienen que hacer:** Comprar el dominio. Lo más fácil es hacerlo directo desde el mismo Vercel (donde está el sitio) con la tarjeta de Liz. Te mostramos cómo en la reunión, tarda 5 minutos.

**Costos:**
- <u>**Hosting (Vercel Plan Pro): $20 USD/mes** — necesario para uso comercial. El proyecto está actualmente en plan gratuito (Hobby) que no permite sitios de negocio.</u>
- <u>**Dominio personalizado: ~$10–15 USD/año** — se compra directo desde Vercel y se conecta automáticamente al proyecto.</u>

Son dos cargos separados: el hosting se cobra cada mes, el dominio una vez al año.

---

## 2. Base de datos — ejecutar unos scripts (nosotros lo hacemos, Liz necesita acceso)

**Qué es:** El sitio guarda toda su información (usuarios, pedidos, citas, cursos) en una base de datos en la nube que se llama Supabase.

**Por qué lo necesitamos:** Hay dos actualizaciones pendientes que agregan columnas nuevas a esa base de datos — sin esas columnas el sitio funciona a medias: el login con Google no crea bien el perfil del usuario y el panel de admin rompe al ver pedidos con envío.

**Qué tienen que hacer:** Liz (o tú) nos dan acceso al panel de Supabase para que nosotros corramos esos scripts. Si ya tienen acceso, en la reunión lo hacemos en 5 minutos. Nosotros pegamos el código, ustedes dan clic en "Run".

---

## 3. MercadoPago — credenciales de producción

**Qué es:** MercadoPago es la plataforma que procesa los pagos de productos, citas y cursos en el sitio.

**Por qué lo necesitamos:** Hoy el sitio está en modo de prueba (con credenciales de "test"). Para que los pagos reales de clientes funcionen, necesitamos las credenciales de producción de la cuenta de negocio de Liz.

**Qué tienen que hacer:**
1. Entrar a mercadopago.com.mx con la cuenta de negocio de Liz
2. Ir a Mis aplicaciones → credenciales de producción
3. Copiarnos dos datos: el **Access Token** (empieza con `APP_USR-`) y el **Webhook Secret**

También necesitamos que en el panel de MercadoPago registren una URL (la dirección del sitio) para que MercadoPago le avise al sitio cuando alguien paga. Eso lo hacemos juntos en la reunión.

---

## 4. Google OAuth — login con Google

**Qué es:** La opción de "Continuar con Google" que tienen las clientas para entrar al sitio sin crear contraseña.

**Por qué lo necesitamos:** Hoy funciona en modo de prueba (solo funciona para las cuentas que registramos nosotros como desarrolladores). Para que cualquier clienta pueda entrar con Google, hay que publicar la app oficialmente.

**Qué tienen que hacer:** La app de Google está en el proyecto `LizCabrialesStudio` en Google Cloud. Liz (o quien tenga acceso) tiene que entrar a ese proyecto y darle clic en "Publicar app". Te guiamos en la reunión, es un solo botón, pero requiere que completen unos datos de la marca (logo, nombre, email de soporte).

---

## 5. Resend — correos automáticos

**Qué es:** Resend es el servicio que manda los correos automáticos del sitio: confirmación de pedido, confirmación de cita, etc.

**Por qué lo necesitamos:** Hoy los correos salen desde una dirección genérica (`onboarding@resend.dev`) que puede llegar al spam de las clientas. Para que salgan desde un correo de marca (por ejemplo `hola@lizcabriales.com`) necesitamos verificar el dominio en Resend.

**Qué tienen que hacer:**
1. Que Liz cree una cuenta en resend.com (es gratis para el volumen que van a manejar)
2. Verificar el dominio (nosotros les decimos exactamente qué hacer en DNS, que generalmente lo maneja quien les vendió el dominio)
3. Copiarnos el API Key de Resend

---

## 6. WhatsApp Business — notificaciones automáticas (puede esperar)

**Qué es:** El sistema puede mandar mensajes de WhatsApp automáticos a las clientas y a Liz: cuando alguien paga, cuando se genera una guía de envío, cuando el pedido es enviado, etc.

**Por qué puede esperar:** El sitio funciona perfectamente sin WhatsApp. Lo construimos de forma que si no está configurado, simplemente no manda mensajes — no rompe nada. Esto lo activamos en una segunda etapa.

**Qué tendrán que hacer eventualmente:**
- Crear una cuenta en Meta Business Manager (Facebook/Meta)
- Registrar el número de WhatsApp de Liz como número de negocio
- Nosotros creamos las plantillas de mensaje y las mandamos a revisión (Meta las aprueba en ~24 horas)

---

## 7. Instagram — feed en la página de inicio (puede esperar o hacerse rápido)

**Qué es:** La sección del sitio que muestra las últimas publicaciones de Instagram de Liz automáticamente.

**Por qué lo necesitamos:** Para que funcione necesitamos un "token" de acceso de la cuenta de Instagram de Liz. Una vez configurado, el sitio lo renueva solo cada mes.

**Qué tienen que hacer:** Que Liz nos dé acceso temporal a su cuenta de Instagram (o que Liz lo haga con nosotros en pantalla) para generar ese token. Tarda 10 minutos.

---

## 8. Datos del negocio que necesitamos confirmar

Hay información de Liz que aparece en los correos y en el sitio. Necesitamos que nos confirmen:

- Dirección física del salón
- Número de WhatsApp oficial (`833 218 3399` — ¿es correcto?)
- Instagram oficial (`@liz_cabriales` — ¿es correcto?)
- Porcentaje de cargo para factura CFDI (Liz lo confirma con su contadora)
- Política de cancelaciones y reembolsos

---

## Orden en el que lo iremos haciendo

| Prioridad | Tarea | Quién | Tiempo estimado |
|-----------|-------|-------|-----------------|
| 1 | Comprar dominio | Liz | 10 min |
| 2 | Scripts de base de datos | Nosotros (Liz da acceso) | 10 min |
| 3 | Credenciales de MercadoPago | Liz | 15 min |
| 4 | Google OAuth publicado | Liz + nosotros | 15 min |
| 5 | Resend verificado | Liz + nosotros | 20 min |
| 6 | Instagram token | Liz + nosotros | 10 min |
| 7 | WhatsApp Business | Segunda etapa | — |

---

## Resumen de lo que necesitas tener a la mano

- Acceso a la cuenta de MercadoPago de Liz (modo negocio)
- Acceso al proyecto de Google Cloud (`LizCabrialesStudio`)
- Acceso al panel de Supabase del proyecto
- La tarjeta de Liz para comprar el dominio
- El número de WhatsApp oficial y dirección del salón confirmados

No es necesario tener todo listo antes de la reunión — lo iremos resolviendo juntos.
