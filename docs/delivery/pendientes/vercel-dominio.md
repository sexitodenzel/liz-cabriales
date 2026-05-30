# Pendiente: Vercel y Dominio

**Bloquea:** sitio accesible en dominio real, SSL, todas las integraciones que dependen de la URL final  
**Responsable:** Liz (plan, ownership, dominio) + Dev (DNS y env vars)

---

## Qué necesita hacer Liz

1. **Vercel:**
   - Confirmar que tiene plan activo (Hobby o Pro según volumen esperado).
   - Ser **owner/admin** del proyecto `liz-cabriales` en Vercel (no solo colaboradora).
   - Facturación a nombre de Liz o su empresa.

2. **Dominio:**
   - Comprar o confirmar la renovación del dominio (ej. `lizcabriales.com`).
   - Tener acceso al panel DNS del registrador (GoDaddy, Namecheap, etc.).

---

## Qué hace el Dev (con acceso o instrucciones de Liz)

1. En el panel del registrador de dominio, configurar DNS para apuntar a Vercel:
   - Agregar registro `A` o `CNAME` según indique Vercel.
   - O transferir nameservers a Vercel si se prefiere gestión centralizada.
2. En **Vercel → Proyecto → Settings → Domains**, agregar el dominio real y verificar que aparece como "Valid".
3. En **Vercel → Environment Variables**, actualizar:
   - `NEXT_PUBLIC_APP_URL` = `https://[dominio-real]`
4. Hacer redeploy para que la variable entre en efecto.
5. Verificar SSL activo (Vercel lo gestiona automáticamente via Let's Encrypt).

---

## Env vars que deben estar completas en Vercel (lista de todas)

```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
RESEND_API_KEY
CRON_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
ADMIN_WHATSAPP_PHONE
INSTAGRAM_ACCESS_TOKEN  (si se usa fallback)
```

---

## Prueba de aceptación

- [ ] `https://[dominio-real]` carga el sitio con SSL (candado verde).
- [ ] No hay redirecciones a `.vercel.app`.
- [ ] Liz puede entrar a Vercel con su cuenta y ve el proyecto como owner.

---

## Referencias

- RACI sección 1 — Infraestructura, dominio y despliegue
- Owner Checklist sección A (Vercel, Dominio) y B (todas las env vars)
- Checklist pre-lanzamiento → Técnico (`NEXT_PUBLIC_APP_URL`, `CRON_SECRET`)
