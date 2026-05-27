CREATE TABLE public.condominiums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  region TEXT,
  city TEXT,
  description TEXT,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Condominiums are publicly readable"
  ON public.condominiums FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert condominiums"
  ON public.condominiums FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update condominiums"
  ON public.condominiums FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete condominiums"
  ON public.condominiums FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_condominiums_updated_at
  BEFORE UPDATE ON public.condominiums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_condominiums_name_lower ON public.condominiums (lower(name));
