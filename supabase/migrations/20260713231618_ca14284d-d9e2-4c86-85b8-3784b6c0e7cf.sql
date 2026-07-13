
DROP POLICY IF EXISTS "Anyone can create leads from public forms" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;

CREATE POLICY "leads_insert_public"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 2 AND 160
    AND (email IS NULL OR length(btrim(email)) <= 254)
    AND (phone IS NULL OR length(regexp_replace(phone, '\D', '', 'g')) BETWEEN 10 AND 15)
    AND pipeline_stage IN ('novos','visita_agendada','proposta','contrato','fechado')
    AND origin IN (
      'fale_conosco',
      'anuncio_proprio',
      'agendamento_visita',
      'contato_site',
      'web',
      'whatsapp',
      'ai_concierge',
      'busca',
      'blog'
    )
  );

GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
