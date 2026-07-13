
-- =====================================================================
-- RPC 1: criar lead público (retorna apenas o id)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_public_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_origin text,
  p_pipeline_stage text DEFAULT 'novos',
  p_score text DEFAULT 'morno',
  p_property_id uuid DEFAULT NULL,
  p_ai_insights text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_origin text := coalesce(nullif(btrim(p_origin), ''), 'web');
  v_stage text := coalesce(nullif(btrim(p_pipeline_stage), ''), 'novos');
  v_score text := coalesce(nullif(btrim(p_score), ''), 'morno');
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 160 THEN
    RAISE EXCEPTION 'Nome inválido' USING ERRCODE = '22023';
  END IF;
  IF v_email IS NOT NULL AND length(v_email) > 254 THEN
    RAISE EXCEPTION 'E-mail inválido' USING ERRCODE = '22023';
  END IF;
  IF v_phone IS NOT NULL THEN
    IF length(regexp_replace(v_phone, '\D', '', 'g')) < 10
       OR length(regexp_replace(v_phone, '\D', '', 'g')) > 15 THEN
      RAISE EXCEPTION 'Telefone inválido' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF v_stage NOT IN ('novos','visita_agendada','proposta','contrato','fechado') THEN
    v_stage := 'novos';
  END IF;
  IF v_origin NOT IN ('fale_conosco','anuncio_proprio','agendamento_visita','contato_site','web','whatsapp','ai_concierge','busca','blog','instagram') THEN
    v_origin := 'web';
  END IF;

  INSERT INTO public.leads (
    name, phone, email, origin, pipeline_stage, score, property_id, ai_insights
  ) VALUES (
    v_name, v_phone, v_email, v_origin, v_stage, v_score, p_property_id, p_ai_insights
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_lead(text,text,text,text,text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_lead(text,text,text,text,text,text,uuid,text) TO anon, authenticated;

-- =====================================================================
-- RPC 2: criar lead + agendamento de visita público
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_public_visit(
  p_name text,
  p_phone text,
  p_email text,
  p_property_id uuid,
  p_property_code text,
  p_broker_name text,
  p_visit_date date,
  p_visit_time text,
  p_ai_insights text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_visit_id uuid;
BEGIN
  v_lead_id := public.create_public_lead(
    p_name := p_name,
    p_phone := p_phone,
    p_email := p_email,
    p_origin := 'agendamento_visita',
    p_pipeline_stage := 'visita_agendada',
    p_score := 'quente',
    p_property_id := p_property_id,
    p_ai_insights := p_ai_insights
  );

  INSERT INTO public.visits_scheduling (
    property_code, property_id, broker_name, visit_date, visit_time,
    event_type, lead_id, lead_name, lead_phone, lead_email
  ) VALUES (
    p_property_code, p_property_id, p_broker_name, p_visit_date, p_visit_time,
    'visita', v_lead_id, btrim(p_name),
    nullif(btrim(coalesce(p_phone,'')), ''),
    nullif(btrim(coalesce(p_email,'')), '')
  )
  RETURNING id INTO v_visit_id;

  RETURN v_visit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_visit(text,text,text,uuid,text,text,date,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_visit(text,text,text,uuid,text,text,date,text,text) TO anon, authenticated;

-- =====================================================================
-- RPC 3: promover lead público existente para visita agendada
-- =====================================================================
CREATE OR REPLACE FUNCTION public.schedule_visit_for_lead(
  p_lead_id uuid,
  p_property_id uuid,
  p_property_code text,
  p_broker_name text,
  p_visit_date date,
  p_visit_time text,
  p_ai_insights text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit_id uuid;
  v_name text;
  v_phone text;
  v_email text;
BEGIN
  SELECT name, phone, email INTO v_name, v_phone, v_email
  FROM public.leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead não encontrado' USING ERRCODE = '22023';
  END IF;

  UPDATE public.leads
  SET pipeline_stage = 'visita_agendada',
      score = 'quente',
      last_contact_at = now(),
      ai_insights = coalesce(p_ai_insights, ai_insights)
  WHERE id = p_lead_id;

  INSERT INTO public.visits_scheduling (
    property_code, property_id, broker_name, visit_date, visit_time,
    event_type, lead_id, lead_name, lead_phone, lead_email
  ) VALUES (
    p_property_code, p_property_id, p_broker_name, p_visit_date, p_visit_time,
    'visita', p_lead_id, v_name, v_phone, v_email
  )
  RETURNING id INTO v_visit_id;

  RETURN v_visit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_visit_for_lead(uuid,uuid,text,text,date,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_visit_for_lead(uuid,uuid,text,text,date,text,text) TO anon, authenticated;
