-- Limpieza de slots obsoletos del PillarStage (sustituido por HomeHeroTriCards).
-- Ejecutar UNA VEZ en Supabase SQL Editor.

DELETE FROM landing_slots
WHERE key IN (
  'pillar_dist_1', 'pillar_dist_2', 'pillar_dist_3',
  'pillar_acad_1', 'pillar_acad_2', 'pillar_acad_3',
  'pillar_serv_1', 'pillar_serv_2', 'pillar_serv_3'
);
