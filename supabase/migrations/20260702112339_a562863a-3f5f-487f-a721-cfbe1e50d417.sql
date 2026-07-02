
ALTER TABLE public.lead_activities
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS edited boolean NOT NULL DEFAULT false;

-- Set created_by on insert if not provided
CREATE OR REPLACE FUNCTION public.set_lead_activity_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_lead_activity_created_by ON public.lead_activities;
CREATE TRIGGER trg_set_lead_activity_created_by
BEFORE INSERT ON public.lead_activities
FOR EACH ROW EXECUTE FUNCTION public.set_lead_activity_created_by();

-- Mark as edited when description changes
CREATE OR REPLACE FUNCTION public.mark_lead_activity_edited()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.description IS DISTINCT FROM OLD.description THEN
    NEW.edited := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_lead_activity_edited ON public.lead_activities;
CREATE TRIGGER trg_mark_lead_activity_edited
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW EXECUTE FUNCTION public.mark_lead_activity_edited();

-- Restrict UPDATE/DELETE to author, admin or gerente
DROP POLICY IF EXISTS "lead_activities_update_by_author_or_admin" ON public.lead_activities;
CREATE POLICY "lead_activities_update_by_author_or_admin" ON public.lead_activities
FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'gerente')
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'gerente')
);

DROP POLICY IF EXISTS "lead_activities_delete_by_author_or_admin" ON public.lead_activities;
CREATE POLICY "lead_activities_delete_by_author_or_admin" ON public.lead_activities
FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'gerente')
);
