
-- Fase 0: padronizar status
UPDATE public.leads SET pipeline_stage = 'fechado' WHERE pipeline_stage = 'fechados';

-- Colunas em leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS assigned_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_source text NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_user_id ON public.leads(assigned_user_id);

ALTER TABLE public.team_profiles
  ADD COLUMN IF NOT EXISTS last_assigned_at timestamptz NULL;

-- crm_settings
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_strategy text NOT NULL DEFAULT 'fallback_only',
  fallback_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  round_robin_pool uuid[] NOT NULL DEFAULT '{}',
  assistant_sees_all boolean NOT NULL DEFAULT true,
  rules_by_origin jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.crm_settings TO authenticated;
GRANT ALL ON public.crm_settings TO service_role;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_settings_admin_select" ON public.crm_settings;
CREATE POLICY "crm_settings_admin_select" ON public.crm_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

DROP POLICY IF EXISTS "crm_settings_admin_write" ON public.crm_settings;
CREATE POLICY "crm_settings_admin_write" ON public.crm_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

INSERT INTO public.crm_settings (assignment_strategy)
  SELECT 'fallback_only'
  WHERE NOT EXISTS (SELECT 1 FROM public.crm_settings);

DROP TRIGGER IF EXISTS trg_crm_settings_updated_at ON public.crm_settings;
CREATE TRIGGER trg_crm_settings_updated_at
  BEFORE UPDATE ON public.crm_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- lead_assignment_history
CREATE TABLE IF NOT EXISTS public.lead_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NULL,
  source text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_assignment_history_lead_id ON public.lead_assignment_history(lead_id);
GRANT SELECT, INSERT ON public.lead_assignment_history TO authenticated;
GRANT ALL ON public.lead_assignment_history TO service_role;
ALTER TABLE public.lead_assignment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lah_admin_all" ON public.lead_assignment_history;
CREATE POLICY "lah_admin_all" ON public.lead_assignment_history
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gerente')
    OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "lah_admin_insert" ON public.lead_assignment_history;
CREATE POLICY "lah_admin_insert" ON public.lead_assignment_history
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- BACKFILL FIRST (antes do trigger de proteção)
DO $$
DECLARE
  v_admin uuid;
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1;
  IF v_admin IS NOT NULL THEN
    UPDATE public.crm_settings SET fallback_user_id = v_admin WHERE fallback_user_id IS NULL;
    UPDATE public.leads
       SET assigned_user_id = v_admin,
           assigned_at = COALESCE(updated_at, now()),
           assignment_source = 'backfill'
     WHERE assigned_user_id IS NULL;
  END IF;
END $$;

-- assign_lead_owner
CREATE OR REPLACE FUNCTION public.assign_lead_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.crm_settings%ROWTYPE;
  v_chosen uuid;
  v_source text;
BEGIN
  SELECT * INTO v_settings FROM public.crm_settings ORDER BY created_at ASC LIMIT 1;

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

  IF v_chosen IS NULL AND v_settings.assignment_strategy = 'rodizio' THEN
    SELECT tp.user_id INTO v_chosen
    FROM public.team_profiles tp
    JOIN public.user_roles ur ON ur.user_id = tp.user_id AND ur.role = 'corretor'
    WHERE tp.is_active IS TRUE
      AND (
        cardinality(COALESCE(v_settings.round_robin_pool, '{}'::uuid[])) = 0
        OR tp.user_id = ANY(v_settings.round_robin_pool)
      )
    ORDER BY COALESCE(tp.last_assigned_at, 'epoch'::timestamptz) ASC
    LIMIT 1;
    IF v_chosen IS NOT NULL THEN
      v_source := 'rodizio';
      UPDATE public.team_profiles SET last_assigned_at = now() WHERE user_id = v_chosen;
    END IF;
  END IF;

  IF v_chosen IS NULL AND v_settings.fallback_user_id IS NOT NULL THEN
    v_chosen := v_settings.fallback_user_id;
    v_source := 'fallback';
  END IF;

  IF v_chosen IS NULL THEN
    RAISE EXCEPTION 'Nenhum responsável disponível para o lead. Configure um usuário fallback em crm_settings.';
  END IF;

  NEW.assigned_user_id := v_chosen;
  NEW.assigned_at := COALESCE(NEW.assigned_at, now());
  NEW.assignment_source := v_source;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_lead_owner ON public.leads;
CREATE TRIGGER trg_assign_lead_owner
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.assign_lead_owner();

-- log_lead_assignment_change
CREATE OR REPLACE FUNCTION public.log_lead_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_user_id IS DISTINCT FROM OLD.assigned_user_id THEN
    INSERT INTO public.lead_assignment_history (lead_id, from_user_id, to_user_id, changed_by, source)
    VALUES (NEW.id, OLD.assigned_user_id, NEW.assigned_user_id, auth.uid(), COALESCE(NEW.assignment_source, 'manual'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_lead_assignment_change ON public.leads;
CREATE TRIGGER trg_log_lead_assignment_change
  AFTER UPDATE OF assigned_user_id ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_assignment_change();

-- prevent_corretor_reassign (permite quando auth.uid() é NULL — sistema/migração)
CREATE OR REPLACE FUNCTION public.prevent_corretor_reassign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_user_id IS DISTINCT FROM OLD.assigned_user_id THEN
    IF auth.uid() IS NOT NULL
       AND NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente')) THEN
      RAISE EXCEPTION 'Apenas administradores e gerentes podem reatribuir leads.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_corretor_reassign ON public.leads;
CREATE TRIGGER trg_prevent_corretor_reassign
  BEFORE UPDATE OF assigned_user_id ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.prevent_corretor_reassign();

-- RLS revisada
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can select leads" ON public.leads;
DROP POLICY IF EXISTS "leads_select_by_role" ON public.leads;
CREATE POLICY "leads_select_by_role" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gerente')
    OR (public.has_role(auth.uid(), 'assistente') AND COALESCE((SELECT assistant_sees_all FROM public.crm_settings LIMIT 1), true))
    OR assigned_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "leads_update_by_role" ON public.leads;
CREATE POLICY "leads_update_by_role" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gerente')
    OR assigned_user_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gerente')
    OR assigned_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can view lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Admins can manage lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_select_by_lead" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_write_by_lead" ON public.lead_notes;

CREATE POLICY "lead_notes_select_by_lead" ON public.lead_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_notes.lead_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'gerente')
          OR (public.has_role(auth.uid(), 'assistente') AND COALESCE((SELECT assistant_sees_all FROM public.crm_settings LIMIT 1), true))
          OR l.assigned_user_id = auth.uid()
        )
    )
  );

CREATE POLICY "lead_notes_write_by_lead" ON public.lead_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_notes.lead_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'gerente')
          OR l.assigned_user_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_notes.lead_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'gerente')
          OR l.assigned_user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Admins can view lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Admins can manage lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_select_by_lead" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_write_by_lead" ON public.lead_activities;

CREATE POLICY "lead_activities_select_by_lead" ON public.lead_activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'gerente')
          OR (public.has_role(auth.uid(), 'assistente') AND COALESCE((SELECT assistant_sees_all FROM public.crm_settings LIMIT 1), true))
          OR l.assigned_user_id = auth.uid()
        )
    )
  );

CREATE POLICY "lead_activities_write_by_lead" ON public.lead_activities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'gerente')
          OR l.assigned_user_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'gerente')
          OR l.assigned_user_id = auth.uid()
        )
    )
  );
