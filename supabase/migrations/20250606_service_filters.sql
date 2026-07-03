-- Filtros de categoría para /servicios (Manos, Pies, personalizados)
CREATE TABLE IF NOT EXISTS public.service_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS filter_id UUID REFERENCES public.service_filters(id) ON DELETE SET NULL;

INSERT INTO public.service_filters (name, slug, sort_order)
SELECT v.name, v.slug, v.sort_order
FROM (
  VALUES
    ('Manos', 'manos', 1),
    ('Pies', 'pies', 2)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_filters f WHERE f.slug = v.slug
);

-- Asignar filtro por defecto según nombre (solo si filter_id es null)
UPDATE public.services s
SET filter_id = f.id
FROM public.service_filters f
WHERE s.filter_id IS NULL
  AND f.slug = 'pies'
  AND (
    lower(s.name) LIKE '%pedicur%'
    OR lower(s.name) LIKE '%pie%'
    OR lower(s.name) LIKE '%podol%'
    OR lower(s.name) LIKE '%quiropod%'
  );

UPDATE public.services s
SET filter_id = f.id
FROM public.service_filters f
WHERE s.filter_id IS NULL
  AND f.slug = 'manos';
