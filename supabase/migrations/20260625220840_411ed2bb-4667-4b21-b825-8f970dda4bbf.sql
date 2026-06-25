
-- Pipeline stages configuráveis
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#2A070C',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  behavior text NOT NULL DEFAULT 'intermediate' CHECK (behavior IN ('initial','intermediate','won','lost')),
  overdue_days int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pipeline_stages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_stages TO authenticated;
GRANT ALL ON public.pipeline_stages TO service_role;

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_stages_read_all"
  ON public.pipeline_stages FOR SELECT
  USING (true);

CREATE POLICY "pipeline_stages_admin_write"
  ON public.pipeline_stages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));

CREATE TRIGGER set_pipeline_stages_updated_at
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: estágios atuais (preserva as keys já usadas em leads.pipeline_stage)
INSERT INTO public.pipeline_stages (key, label, color, sort_order, behavior, overdue_days) VALUES
  ('novos',            'Novos',            '#6B2D3E', 10, 'initial',      2),
  ('visita_agendada',  'Visita Agendada',  '#A85D6F', 20, 'intermediate', 5),
  ('proposta',         'Proposta',         '#2A070C', 30, 'intermediate', 7),
  ('contrato',         'Contrato',         '#1E5128', 40, 'intermediate', 10),
  ('fechado',          'Fechado',          '#0F3D1F', 50, 'won',          NULL)
ON CONFLICT (key) DO NOTHING;

-- Excluir um estágio reatribuindo os leads
CREATE OR REPLACE FUNCTION public.delete_pipeline_stage(p_key text, p_reassign_to text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente')) THEN
    RAISE EXCEPTION 'Apenas administradores ou gerentes podem excluir estágios.';
  END IF;
  IF p_key = p_reassign_to THEN
    RAISE EXCEPTION 'O estágio de destino deve ser diferente.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE key = p_reassign_to) THEN
    RAISE EXCEPTION 'Estágio destino inexistente.';
  END IF;
  UPDATE public.leads SET pipeline_stage = p_reassign_to WHERE pipeline_stage = p_key;
  DELETE FROM public.pipeline_stages WHERE key = p_key;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_pipeline_stage(text, text) TO authenticated;
