DROP POLICY IF EXISTS pipeline_stages_read_all ON public.pipeline_stages;

CREATE POLICY pipeline_stages_read_crm_team
ON public.pipeline_stages
FOR SELECT
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR public.has_role((SELECT auth.uid()), 'gerente'::public.app_role)
  OR public.has_role((SELECT auth.uid()), 'corretor'::public.app_role)
  OR public.has_role((SELECT auth.uid()), 'assistente'::public.app_role)
);

REVOKE ALL ON public.pipeline_stages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_stages TO authenticated;
GRANT ALL ON public.pipeline_stages TO service_role;