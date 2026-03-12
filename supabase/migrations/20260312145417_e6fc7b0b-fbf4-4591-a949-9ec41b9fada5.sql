CREATE TABLE public.visits_scheduling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_code text NOT NULL,
  broker_name text NOT NULL,
  visit_date date NOT NULL,
  visit_time text NOT NULL,
  lead_name text NOT NULL,
  lead_phone text NOT NULL,
  lead_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE POLICY "Anyone can create visit scheduling"
  ON public.visits_scheduling FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Admins can read visits"
  ON public.visits_scheduling FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));