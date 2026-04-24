-- Limpa endereços inválidos vindos do XML Kenlo
UPDATE public.properties
SET address = NULL
WHERE address ILIKE '%endereço não informado%'
   OR address ILIKE '%endereco nao informado%';

-- Adiciona campo address aos campos protegidos da sincronização
UPDATE public.site_settings
SET value = jsonb_set(
  value,
  '{protected_fields}',
  COALESCE(value->'protected_fields', '[]'::jsonb) || '["address"]'::jsonb
),
updated_at = now()
WHERE key = 'kenlo_sync_config'
  AND NOT (value->'protected_fields' ? 'address');