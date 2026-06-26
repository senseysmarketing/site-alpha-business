
-- 1) Extend visits_scheduling
ALTER TABLE public.visits_scheduling
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'visita',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Loosen NOT NULLs that don't apply to eventos/tarefas
ALTER TABLE public.visits_scheduling
  ALTER COLUMN lead_name DROP NOT NULL,
  ALTER COLUMN lead_phone DROP NOT NULL,
  ALTER COLUMN lead_email DROP NOT NULL,
  ALTER COLUMN property_code DROP NOT NULL,
  ALTER COLUMN broker_name DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visits_event_type_check'
  ) THEN
    ALTER TABLE public.visits_scheduling
      ADD CONSTRAINT visits_event_type_check CHECK (event_type IN ('visita','evento','tarefa'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visits_status_check'
  ) THEN
    ALTER TABLE public.visits_scheduling
      ADD CONSTRAINT visits_status_check CHECK (status IN ('pendente','concluido','cancelado'));
  END IF;
END $$;

-- 2) Updated_at trigger
DROP TRIGGER IF EXISTS visits_set_updated_at ON public.visits_scheduling;
CREATE TRIGGER visits_set_updated_at
BEFORE UPDATE ON public.visits_scheduling
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Default assignment trigger (BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.set_agenda_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match uuid;
BEGIN
  NEW.created_by := COALESCE(NEW.created_by, v_uid);

  IF NEW.assigned_user_id IS NULL THEN
    IF v_uid IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_uid AND ur.role IN ('admin','gerente','corretor')
    ) THEN
      NEW.assigned_user_id := v_uid;
    ELSIF NEW.broker_name IS NOT NULL THEN
      SELECT tp.user_id INTO v_match
      FROM public.team_profiles tp
      WHERE lower(tp.full_name) = lower(NEW.broker_name)
        AND tp.is_active = true
      LIMIT 1;
      NEW.assigned_user_id := v_match;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visits_set_defaults ON public.visits_scheduling;
CREATE TRIGGER visits_set_defaults
BEFORE INSERT ON public.visits_scheduling
FOR EACH ROW EXECUTE FUNCTION public.set_agenda_defaults();

-- 4) Rewrite RLS
DROP POLICY IF EXISTS "Anyone can create visit scheduling" ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_select_admin_manager ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_select_own_broker ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_insert_public ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_insert_authenticated ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_update_admin_manager ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_update_owner ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_delete_admin_manager ON public.visits_scheduling;
DROP POLICY IF EXISTS visits_delete_owner ON public.visits_scheduling;

ALTER TABLE public.visits_scheduling ENABLE ROW LEVEL SECURITY;

-- SELECT: admin/gerente todos; corretor/assistente apenas assigned ou criados por ele
CREATE POLICY visits_select_admin_manager
ON public.visits_scheduling FOR SELECT
TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gerente'));

CREATE POLICY visits_select_own
ON public.visits_scheduling FOR SELECT
TO authenticated
USING (assigned_user_id = auth.uid() OR created_by = auth.uid());

-- INSERT público (formulário do site)
CREATE POLICY visits_insert_public
ON public.visits_scheduling FOR INSERT
TO anon
WITH CHECK (event_type = 'visita');

-- INSERT autenticados
CREATE POLICY visits_insert_authenticated
ON public.visits_scheduling FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE
CREATE POLICY visits_update_admin_manager
ON public.visits_scheduling FOR UPDATE
TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gerente'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gerente'));

CREATE POLICY visits_update_owner
ON public.visits_scheduling FOR UPDATE
TO authenticated
USING (assigned_user_id = auth.uid() OR created_by = auth.uid())
WITH CHECK (assigned_user_id = auth.uid() OR created_by = auth.uid());

-- DELETE
CREATE POLICY visits_delete_admin_manager
ON public.visits_scheduling FOR DELETE
TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gerente'));

CREATE POLICY visits_delete_owner
ON public.visits_scheduling FOR DELETE
TO authenticated
USING (assigned_user_id = auth.uid() OR created_by = auth.uid());

-- Garantir grants para anon (insert visita pública)
GRANT INSERT ON public.visits_scheduling TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits_scheduling TO authenticated;
GRANT ALL ON public.visits_scheduling TO service_role;

-- 5) Trigger de notificação por e-mail (criação + reatribuição)
CREATE OR REPLACE FUNCTION public.notify_agenda_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_url text := 'https://cnzmxxvqmvhdtyqbqnlf.supabase.co/functions/v1/send-agenda-notification';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuem14eHZxbXZoZHR5cWJxbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTkzNDMsImV4cCI6MjA4ODg5NTM0M30.AJjEHqvXoAhTTJdy3SX2_lZ_DmIKi2FMZGJkTPi6ATQ';
  v_event text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'created';
  ELSE
    IF NEW.assigned_user_id IS DISTINCT FROM OLD.assigned_user_id THEN
      v_event := 'reassigned';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.assigned_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer ' || v_anon
      ),
      body := jsonb_build_object(
        'mode','auto',
        'event_id', NEW.id,
        'event', v_event
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'notify_agenda_event failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_agenda_insert ON public.visits_scheduling;
CREATE TRIGGER trg_notify_agenda_insert
AFTER INSERT ON public.visits_scheduling
FOR EACH ROW EXECUTE FUNCTION public.notify_agenda_event();

DROP TRIGGER IF EXISTS trg_notify_agenda_reassign ON public.visits_scheduling;
CREATE TRIGGER trg_notify_agenda_reassign
AFTER UPDATE OF assigned_user_id ON public.visits_scheduling
FOR EACH ROW EXECUTE FUNCTION public.notify_agenda_event();
