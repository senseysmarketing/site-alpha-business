
-- Broaden allowed origins on the public insert policy
DROP POLICY IF EXISTS leads_insert_public ON public.leads;
CREATE POLICY leads_insert_public ON public.leads
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(name)) >= 2 AND length(btrim(name)) <= 160
  AND (email IS NULL OR length(btrim(email)) <= 254)
  AND (phone IS NULL OR (length(regexp_replace(phone, '\D','','g')) >= 10 AND length(regexp_replace(phone, '\D','','g')) <= 15))
  AND pipeline_stage = ANY (ARRAY['novos','visita_agendada','proposta','contrato','fechado'])
  AND origin = ANY (ARRAY['fale_conosco','anuncio_proprio','agendamento_visita','contato_site','web','whatsapp','ai_concierge','busca','blog','indicacao','instagram'])
);

-- Allow gerente/corretor/assistente to insert leads via CRM
DROP POLICY IF EXISTS "Team can insert leads" ON public.leads;
CREATE POLICY "Team can insert leads" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gerente'::app_role)
  OR has_role(auth.uid(), 'corretor'::app_role)
  OR has_role(auth.uid(), 'assistente'::app_role)
);

-- Auto-assign lead to the creating user when they are corretor/assistente and no assignee is set
CREATE OR REPLACE FUNCTION public.auto_assign_lead_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_user_id IS NULL AND auth.uid() IS NOT NULL THEN
    IF has_role(auth.uid(), 'corretor'::app_role)
       OR has_role(auth.uid(), 'assistente'::app_role)
       OR has_role(auth.uid(), 'gerente'::app_role) THEN
      NEW.assigned_user_id := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_lead_to_creator ON public.leads;
CREATE TRIGGER trg_auto_assign_lead_to_creator
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_lead_to_creator();
