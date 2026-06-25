
-- 1) crm_settings: novas colunas
ALTER TABLE public.crm_settings
  ADD COLUMN IF NOT EXISTS recurring_lead_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recurring_lead_window_months integer;

-- 2) leads: colunas normalizadas + trigger + índices
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_normalized text,
  ADD COLUMN IF NOT EXISTS email_normalized text;

CREATE OR REPLACE FUNCTION public.set_lead_normalized_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.phone_normalized := NULLIF(regexp_replace(COALESCE(NEW.phone, ''), '\D', '', 'g'), '');
  -- mantém apenas os últimos 11 dígitos para neutralizar DDI variações (55 / +55 / sem)
  IF NEW.phone_normalized IS NOT NULL AND length(NEW.phone_normalized) > 11 THEN
    NEW.phone_normalized := right(NEW.phone_normalized, 11);
  END IF;
  NEW.email_normalized := NULLIF(lower(trim(COALESCE(NEW.email, ''))), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_lead_normalized_fields ON public.leads;
CREATE TRIGGER trg_set_lead_normalized_fields
BEFORE INSERT OR UPDATE OF phone, email ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_normalized_fields();

-- Backfill
UPDATE public.leads
SET phone_normalized = CASE
      WHEN phone IS NULL THEN NULL
      WHEN length(regexp_replace(phone, '\D', '', 'g')) > 11
        THEN right(regexp_replace(phone, '\D', '', 'g'), 11)
      ELSE NULLIF(regexp_replace(phone, '\D', '', 'g'), '')
    END,
    email_normalized = NULLIF(lower(trim(email)), '');

CREATE INDEX IF NOT EXISTS idx_leads_phone_normalized ON public.leads(phone_normalized) WHERE phone_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email_normalized ON public.leads(email_normalized) WHERE email_normalized IS NOT NULL;

-- 3) assign_lead_owner: recorrência entre manual e regras
CREATE OR REPLACE FUNCTION public.assign_lead_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_settings public.crm_settings%ROWTYPE;
  v_chosen uuid;
  v_source text;
  v_rule public.crm_assignment_rules%ROWTYPE;
  v_member_id uuid;
  v_member_user uuid;
  v_matched jsonb;
  v_cond jsonb;
  v_prev_lead public.leads%ROWTYPE;
  v_match_type text;
  v_window_start timestamptz;
BEGIN
  SELECT * INTO v_settings FROM public.crm_settings ORDER BY created_at ASC LIMIT 1;

  -- (1) Atribuição manual válida
  IF NEW.assigned_user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = NEW.assigned_user_id
        AND ur.role IN ('corretor','admin','gerente')
    ) THEN
      v_chosen := NEW.assigned_user_id;
      v_source := COALESCE(NEW.assignment_source, 'manual');
    END IF;
  END IF;

  -- (1.5) Recorrência: mesmo cliente → mesmo corretor
  IF v_chosen IS NULL
     AND COALESCE(v_settings.recurring_lead_enabled, true)
     AND (NEW.phone_normalized IS NOT NULL OR NEW.email_normalized IS NOT NULL) THEN

    IF v_settings.recurring_lead_window_months IS NULL THEN
      v_window_start := 'epoch'::timestamptz;
    ELSE
      v_window_start := now() - make_interval(months => v_settings.recurring_lead_window_months);
    END IF;

    -- prioriza telefone
    IF NEW.phone_normalized IS NOT NULL THEN
      SELECT l.* INTO v_prev_lead
      FROM public.leads l
      WHERE l.id <> NEW.id
        AND l.phone_normalized = NEW.phone_normalized
        AND l.assigned_user_id IS NOT NULL
        AND l.created_at >= v_window_start
      ORDER BY l.created_at DESC
      LIMIT 1;
      IF FOUND THEN v_match_type := 'phone'; END IF;
    END IF;

    IF NOT FOUND AND NEW.email_normalized IS NOT NULL THEN
      SELECT l.* INTO v_prev_lead
      FROM public.leads l
      WHERE l.id <> NEW.id
        AND l.email_normalized = NEW.email_normalized
        AND l.assigned_user_id IS NOT NULL
        AND l.created_at >= v_window_start
      ORDER BY l.created_at DESC
      LIMIT 1;
      IF FOUND THEN v_match_type := 'email'; END IF;
    END IF;

    IF v_prev_lead.id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM public.team_profiles tp
         WHERE tp.user_id = v_prev_lead.assigned_user_id AND tp.is_active = true
       )
       AND EXISTS (
         SELECT 1 FROM public.user_roles ur
         WHERE ur.user_id = v_prev_lead.assigned_user_id
           AND ur.role IN ('corretor','admin','gerente')
       ) THEN
      v_chosen := v_prev_lead.assigned_user_id;
      v_source := 'recurring';
      NEW.last_assignment_rule_id := NULL;
      NEW.last_assignment_rule_name := 'Recorrência (' || v_match_type || ')';
      NEW.last_matched_conditions := jsonb_build_object(
        'match_type', v_match_type,
        'previous_lead_id', v_prev_lead.id
      );
    END IF;
  END IF;

  -- (2) Regras por prioridade
  IF v_chosen IS NULL THEN
    FOR v_rule IN
      SELECT * FROM public.crm_assignment_rules
      WHERE is_active = true
      ORDER BY priority ASC, created_at ASC
    LOOP
      v_cond := v_rule.conditions;

      IF (v_cond ? 'origin') AND COALESCE(v_cond->>'origin','') <> '' AND NEW.origin IS DISTINCT FROM (v_cond->>'origin') THEN CONTINUE; END IF;
      IF (v_cond ? 'pipeline_stage') AND COALESCE(v_cond->>'pipeline_stage','') <> '' AND NEW.pipeline_stage IS DISTINCT FROM (v_cond->>'pipeline_stage') THEN CONTINUE; END IF;
      IF (v_cond ? 'score') AND COALESCE(v_cond->>'score','') <> '' AND NEW.score IS DISTINCT FROM (v_cond->>'score') THEN CONTINUE; END IF;
      IF (v_cond ? 'property_id') AND COALESCE(v_cond->>'property_id','') <> '' AND NEW.property_id IS DISTINCT FROM ((v_cond->>'property_id')::uuid) THEN CONTINUE; END IF;
      IF (v_cond ? 'deal_value_min') AND COALESCE(v_cond->>'deal_value_min','') <> '' AND (NEW.deal_value IS NULL OR NEW.deal_value < (v_cond->>'deal_value_min')::numeric) THEN CONTINUE; END IF;
      IF (v_cond ? 'deal_value_max') AND COALESCE(v_cond->>'deal_value_max','') <> '' AND (NEW.deal_value IS NULL OR NEW.deal_value > (v_cond->>'deal_value_max')::numeric) THEN CONTINUE; END IF;

      v_member_user := NULL;
      v_member_id := NULL;

      IF v_rule.distribution_type = 'fixed' THEN
        IF v_rule.fixed_user_id IS NOT NULL
           AND EXISTS (SELECT 1 FROM public.team_profiles tp WHERE tp.user_id = v_rule.fixed_user_id AND tp.is_active = true)
           AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = v_rule.fixed_user_id AND ur.role IN ('corretor','admin','gerente')) THEN
          v_member_user := v_rule.fixed_user_id;
        END IF;
      ELSIF v_rule.distribution_type = 'sequence' THEN
        SELECT m.id, m.user_id INTO v_member_id, v_member_user
        FROM public.crm_assignment_rule_members m
        JOIN public.team_profiles tp ON tp.user_id = m.user_id AND tp.is_active = true
        JOIN public.user_roles ur ON ur.user_id = m.user_id AND ur.role IN ('corretor','admin','gerente')
        WHERE m.rule_id = v_rule.id AND m.is_active = true
        ORDER BY COALESCE(m.last_assigned_at, 'epoch'::timestamptz) ASC, m.sort_order ASC
        LIMIT 1;
        IF v_member_id IS NOT NULL THEN
          UPDATE public.crm_assignment_rule_members SET last_assigned_at = now() WHERE id = v_member_id;
        END IF;
      ELSIF v_rule.distribution_type = 'random' THEN
        SELECT m.user_id INTO v_member_user
        FROM public.crm_assignment_rule_members m
        JOIN public.team_profiles tp ON tp.user_id = m.user_id AND tp.is_active = true
        JOIN public.user_roles ur ON ur.user_id = m.user_id AND ur.role IN ('corretor','admin','gerente')
        WHERE m.rule_id = v_rule.id AND m.is_active = true
        ORDER BY random()
        LIMIT 1;
      END IF;

      IF v_member_user IS NOT NULL THEN
        v_chosen := v_member_user;
        v_source := 'rule';
        v_matched := jsonb_strip_nulls(jsonb_build_object(
          'origin', v_cond->'origin',
          'pipeline_stage', v_cond->'pipeline_stage',
          'score', v_cond->'score',
          'property_id', v_cond->'property_id',
          'deal_value_min', v_cond->'deal_value_min',
          'deal_value_max', v_cond->'deal_value_max'
        ));
        NEW.last_assignment_rule_id := v_rule.id;
        NEW.last_assignment_rule_name := v_rule.name;
        NEW.last_matched_conditions := v_matched;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- (3) Fallback
  IF v_chosen IS NULL AND v_settings.fallback_user_id IS NOT NULL THEN
    v_chosen := v_settings.fallback_user_id;
    v_source := 'fallback';
    NEW.last_assignment_rule_id := NULL;
    NEW.last_assignment_rule_name := NULL;
    NEW.last_matched_conditions := NULL;
  END IF;

  IF v_chosen IS NULL THEN
    RAISE EXCEPTION 'Nenhum responsável disponível para o lead. Configure um responsável fallback em crm_settings.';
  END IF;

  NEW.assigned_user_id := v_chosen;
  NEW.assigned_at := COALESCE(NEW.assigned_at, now());
  NEW.assignment_source := v_source;
  RETURN NEW;
END;
$function$;
