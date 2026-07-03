-- Filtros de especialidad por trabajadora (Manos, Pies, etc.)
CREATE TABLE IF NOT EXISTS public.professional_filter_links (
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  filter_id UUID NOT NULL REFERENCES public.service_filters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (professional_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_professional_filter_links_filter
  ON public.professional_filter_links (filter_id);
