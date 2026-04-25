# Checklist pre-lanzamiento

## Técnico

- [ ] `CRON_SECRET` generado y en variables de entorno de Vercel
- [ ] `NEXT_PUBLIC_APP_URL` actualizado al dominio real en Vercel
- [ ] `MERCADOPAGO_ACCESS_TOKEN` de producción en Vercel
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` de producción en Vercel
- [ ] Webhook URL registrada en panel MP: `https://[dominio]/api/webhooks/mercadopago`
- [ ] Dominio de Resend verificado y remitente (`from`) actualizado
- [ ] `SALON_ADDRESS` real en `lib/email/templates/_shared.ts`
- [ ] SQL ejecutado: constraint `users_role_check` + columnas CFDI en `orders` (ver `docs/delivery/sql-sprint5-supabase.sql`)
- [ ] `tsc --noEmit` limpio
- [ ] Build de producción sin errores

## Contenido

- [ ] Productos reales importados
- [ ] Fotos reales de productos
- [ ] Logos de marcas en BrandsSlider
- [ ] Textos reales en landing (no placeholders)
- [ ] Al menos 1 curso publicado
- [ ] Servicios con precios reales

## Operativo

- [ ] Liz tiene credenciales de admin
- [ ] Cuenta de recepcionista creada
- [ ] Liz aprobó el diseño en staging
- [ ] Video tutorial grabado
- [ ] Manual PDF entregado
