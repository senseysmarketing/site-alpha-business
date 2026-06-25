
DROP POLICY IF EXISTS "Authenticated can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can read lead_activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Authenticated can read lead_notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Authenticated can read team_profiles" ON public.team_profiles;

CREATE POLICY "team_profiles_select_admin_manager"
  ON public.team_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "team_profiles_select_self"
  ON public.team_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "team_profiles_select_public_fields"
  ON public.team_profiles FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      public.has_role(auth.uid(), 'corretor')
      OR public.has_role(auth.uid(), 'assistente')
    )
  );

DROP VIEW IF EXISTS public.team_profiles_public;
CREATE VIEW public.team_profiles_public
WITH (security_invoker = on) AS
SELECT id, user_id, full_name, avatar_url, role_display, is_active
FROM public.team_profiles
WHERE is_active = true;

GRANT SELECT ON public.team_profiles_public TO authenticated;

DROP POLICY IF EXISTS "Admins can read visits" ON public.visits_scheduling;

CREATE POLICY "visits_select_admin_manager"
  ON public.visits_scheduling FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "visits_select_own_broker"
  ON public.visits_scheduling FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_profiles tp
      WHERE tp.user_id = auth.uid()
        AND lower(tp.full_name) = lower(visits_scheduling.broker_name)
    )
  );
