
-- Backfill property_id em visits_scheduling usando property_code
UPDATE public.visits_scheduling v
SET property_id = p.id
FROM public.properties p
WHERE v.property_id IS NULL
  AND v.property_code IS NOT NULL
  AND p.code = v.property_code;

-- Backfill lead_id via telefone normalizado (últimos 11 dígitos)
WITH candidates AS (
  SELECT DISTINCT ON (v.id) v.id AS visit_id, l.id AS lead_id
  FROM public.visits_scheduling v
  JOIN public.leads l
    ON l.phone_normalized IS NOT NULL
   AND l.phone_normalized = right(regexp_replace(coalesce(v.lead_phone, ''), '\D', '', 'g'), 11)
  WHERE v.lead_id IS NULL
    AND v.lead_phone IS NOT NULL
    AND length(regexp_replace(v.lead_phone, '\D', '', 'g')) >= 10
  ORDER BY v.id, l.created_at DESC
)
UPDATE public.visits_scheduling v
SET lead_id = c.lead_id
FROM candidates c
WHERE v.id = c.visit_id;

-- Backfill lead_id restante via e-mail normalizado
WITH candidates AS (
  SELECT DISTINCT ON (v.id) v.id AS visit_id, l.id AS lead_id
  FROM public.visits_scheduling v
  JOIN public.leads l
    ON l.email_normalized IS NOT NULL
   AND l.email_normalized = lower(trim(coalesce(v.lead_email, '')))
  WHERE v.lead_id IS NULL
    AND v.lead_email IS NOT NULL
    AND length(trim(v.lead_email)) > 0
  ORDER BY v.id, l.created_at DESC
)
UPDATE public.visits_scheduling v
SET lead_id = c.lead_id
FROM candidates c
WHERE v.id = c.visit_id;
