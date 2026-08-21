# Checklist — Módulo Media (`/admin/media`)

Imágenes fijas editables por slot. Cada slot vive en la tabla `landing_slots`
y se edita desde **`/admin/media`** (requiere login admin). El código ya está
cableado: mientras un slot tenga un placeholder, la página muestra el
placeholder; al subir una imagen real por su `key`, aparece sola en la página
(revalidación ~60 s).

> **Estado a la fecha del último chequeo (BD de producción):** 13 imágenes
> reales pendientes. La migración `supabase/migrations/20260722_media_module_slots.sql`
> ya está corrida (las filas existen), solo falta subir las imágenes.

Cada upload pasa por `compressImage()` antes de ir al bucket `images` de
Supabase — no subir sin comprimir (ver [pipeline de imágenes](../lib/image-compress.ts)).

---

## Pendientes de subir (11)

### Home — tri-cards del hero  ·  superficie: `/`
Formato tipo tarjeta (vertical, recorta al centro). Las tres ya tienen foto real.

- [x] `home_tri_academia` — Tri-card Academia  ✅ (foto del área técnica)
- [x] `home_tri_cabina` — Tri-card Cabina / Citas  ✅ (uñas esculturales)
- [x] `home_tri_tienda` — Tri-card Tienda  ✅ ya configurada

### Servicios — galería del estudio  ·  superficie: `/servicios`
Collage + lightbox. Formato recomendado **1200×900 px** (la 1 es la grande).

- [ ] `servicios_gallery_1` — Galería 1 (grande)
- [ ] `servicios_gallery_2` — Galería 2
- [ ] `servicios_gallery_3` — Galería 3
- [ ] `servicios_gallery_4` — Galería 4
- [ ] `servicios_gallery_5` — Galería 5

### Academia — hero (collage superior)  ·  superficie: `/academia`
Formato recomendado **1200×900 px** (la 1 es la grande).

- [ ] `academia_hero_1` — Hero Academia 1 (grande)
- [ ] `academia_hero_2` — Hero Academia 2
- [ ] `academia_hero_3` — Hero Academia 3

### Blog — hero (collage superior)  ·  superficie: `/blog`
Formato recomendado **700×900 px**.

- [ ] `blog_hero_1` — Hero Blog 1
- [ ] `blog_hero_2` — Hero Blog 2
- [ ] `blog_hero_3` — Hero Blog 3

---

## Ya configurados (no tocar salvo cambio de diseño)

- `brand` — Foto de Sobre Liz: `brand_photo`  ✅ (1 real)
- `home` — Tri-cards del hero: `home_tri_tienda/academia/cabina`  ✅ (3 reales)

> La sección `hero` (`hero_1`, `hero_4`, `hero_slide_1/2/3`) ya no existe: era
> del carrusel clásico, ningún componente la leía y se borró en
> `sql-landing-slots-cleanup-hero.sql`. El hero de hoy son las tri-cards de
> sección `home`.

---

## Prioridad sugerida

1. **Servicios** (5) — página de conversión principal; fallback picsum.
2. **Academia** (3) — fallback picsum.
3. **Blog** (3) — fallback picsum.

## Referencia de slots en código

Las `key` y sus URLs de fallback están en [`lib/media-slots.ts`](../lib/media-slots.ts).
Consumidores: home → `HomeHeroTriCards`; servicios → `ServiciosLanding`;
academia → `AcademiaHero`; blog → `app/blog/page.tsx`.
