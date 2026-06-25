
-- ========================================================================
-- 1. Tabela crm_assignment_rules
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.crm_assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  distribution_type text NOT NULL CHECK (distribution_type IN ('fixed','sequence','random')),
  fixed_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_assignment_rules TO authenticated;
GRANT ALL ON public.crm_assignment_rules TO service_role;

ALTER TABLE public.crm_assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gerente gerenciam regras de atribuição"
ON public.crm_assignment_rules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Equipe pode visualizar regras de atribuição"
ON public.crm_assignment_rules
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'gerente')
  OR public.has_role(auth.uid(), 'corretor')
  OR public.has_role(auth.uid(), 'assistente')
);

CREATE INDEX IF NOT EXISTS idx_crm_rules_active_priority
  ON public.crm_assignment_rules (is_active, priority);

CREATE TRIGGER trg_crm_rules_updated_at
BEFORE UPDATE ON public.crm_assignment_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================================================
-- 2. Tabela crm_assignment_rule_members
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.crm_assignment_rule_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.crm_assignment_rules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  last_assigned_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_assignment_rule_members TO authenticated;
GRANT ALL ON public.crm_assignment_rule_members TO service_role;

ALTER TABLE public.crm_assignment_rule_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gerente gerenciam membros de regra"
ON public.crm_assignment_rule_members
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Equipe pode visualizar membros de regra"
ON public.crm_assignment_rule_members
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'gerente')
  OR public.has_role(auth.uid(), 'corretor')
  OR public.has_role(auth.uid(), 'assistente')
);

CREATE INDEX IF NOT EXISTS idx_crm_rule_members_rule
  ON public.crm_assignment_rule_members (rule_id, is_active);

CREATE TRIGGER trg_crm_rule_members_updated_at
BEFORE UPDATE ON public.crm_assignment_rule_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================================================
-- 3. Evoluir lead_assignment_history e leads
-- ========================================================================
ALTER TABLE public.lead_assignment_history
  ADD COLUMN IF NOT EXISTS rule_id uuid NULL REFERENCES public.crm_assignment_rules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rule_name text NULL,
  ADD COLUMN IF NOT EXISTS distribution_type text NULL,
  ADD COLUMN IF NOT EXISTS matched_conditions jsonb NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_assignment_rule_id uuid NULL REFERENCES public.crm_assignment_rules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_assignment_rule_name text NULL,
  ADD COLUMN IF NOT EXISTS last_matched_conditions jsonb NULL;

-- ========================================================================
-- 4. Proteção do fallback em crm_settings
-- ========================================================================
CREATE OR REPLACE FUNCTION public.protect_crm_fallback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.fallback_user_id IS DISTINCT FROM OLD.fallback_user_id THEN
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'O responsável fallback não pode ser alterado pelo painel. Solicite manutenção técnica.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_crm_fallback ON public.crm_settings;
CREATE TRIGGER trg_protect_crm_fallback
BEFORE UPDATE ON public.crm_settings
FOR EACH ROW EXECUTE FUNCTION public.protect_crm_fallback();

-- ========================================================================
-- 5. Nova assign_lead_owner (motor de regras + fallback)
-- ========================================================================
CREATE OR REPLACE FUNCTION public.assign_lead_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings public.crm_settings%ROWTYPE;
  v_chosen uuid;
  v_source text;
  v_rule public.crm_assignment_rules%ROWTYPE;
  v_member_id uuid;
  v_member_user uuid;
  v_matched jsonb;
  v_cond jsonb;
BEGIN
  SELECT * INTO v_settings FROM public.crm_settings ORDER BY created_at ASC LIMIT 1;

  -- (1) Atribuição manual válida tem precedência
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

  -- (2) Avaliar regras por prioridade
  IF v_chosen IS NULL THEN
    FOR v_rule IN
      SELECT * FROM public.crm_assignment_rules
      WHERE is_active = true
      ORDER BY priority ASC, created_at ASC
    LOOP
      v_cond := v_rule.conditions;

      -- Avaliação das condições (todas devem casar)
      IF (v_cond ? 'origin') AND COALESCE(v_cond->>'origin','') <> '' AND NEW.origin IS DISTINCT FROM (v_cond->>'origin') THEN CONTINUE; END IF;
      IF (v_cond ? 'pipeline_stage') AND COALESCE(v_cond->>'pipeline_stage','') <> '' AND NEW.pipeline_stage IS DISTINCT FROM (v_cond->>'pipeline_stage') THEN CONTINUE; END IF;
      IF (v_cond ? 'score') AND COALESCE(v_cond->>'score','') <> '' AND NEW.score IS DISTINCT FROM (v_cond->>'score') THEN CONTINUE; END IF;
      IF (v_cond ? 'property_id') AND COALESCE(v_cond->>'property_id','') <> '' AND NEW.property_id IS DISTINCT FROM ((v_cond->>'property_id')::uuid) THEN CONTINUE; END IF;
      IF (v_cond ? 'deal_value_min') AND COALESCE(v_cond->>'deal_value_min','') <> '' AND (NEW.deal_value IS NULL OR NEW.deal_value < (v_cond->>'deal_value_min')::numeric) THEN CONTINUE; END IF;
      IF (v_cond ? 'deal_value_max') AND COALESCE(v_cond->>'deal_value_max','') <> '' AND (NEW.deal_value IS NULL OR NEW.deal_value > (v_cond->>'deal_value_max')::numeric) THEN CONTINUE; END IF;

      -- Escolha por tipo
      v_member_user := NULL;
      v_member_id := NULL;

      IF v_rule.distribution_type = 'fixed' THEN
        IF v_rule.fixed_user_id IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM public.team_profiles tp
             WHERE tp.user_id = v_rule.fixed_user_id AND tp.is_active = true
           )
           AND EXISTS (
             SELECT 1 FROM public.user_roles ur
             WHERE ur.user_id = v_rule.fixed_user_id
               AND ur.role IN ('corretor','admin','gerente')
           ) THEN
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

  -- (3) Fallback obrigatório
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
$$;

-- ========================================================================
-- 6. Trigger de histórico inclui regra e distribuição
-- ========================================================================
CREATE OR REPLACE FUNCTION public.log_lead_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dist text := NULL;
BEGIN
  IF NEW.assigned_user_id IS DISTINCT FROM OLD.assigned_user_id
     OR (TG_OP = 'INSERT' AND NEW.assigned_user_id IS NOT NULL) THEN
    IF NEW.last_assignment_rule_id IS NOT NULL THEN
      SELECT distribution_type INTO v_dist FROM public.crm_assignment_rules WHERE id = NEW.last_assignment_rule_id;
    END IF;
    INSERT INTO public.lead_assignment_history (
      lead_id, from_user_id, to_user_id, changed_by, source,
      rule_id, rule_name, distribution_type, matched_conditions
    )
    VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.assigned_user_id ELSE NULL END,
      NEW.assigned_user_id,
      auth.uid(),
      COALESCE(NEW.assignment_source, 'manual'),
      NEW.last_assignment_rule_id,
      NEW.last_assignment_rule_name,
      v_dist,
      NEW.last_matched_conditions
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Garantir que o trigger de histórico cubra INSERT também
DROP TRIGGER IF EXISTS trg_log_lead_assignment_change ON public.leads;
CREATE TRIGGER trg_log_lead_assignment_change
AFTER INSERT OR UPDATE OF assigned_user_id ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_lead_assignment_change();
