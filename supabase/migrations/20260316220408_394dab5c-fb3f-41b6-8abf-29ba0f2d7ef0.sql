
-- 1. Leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  pipeline_stage text NOT NULL DEFAULT 'novos',
  score text NOT NULL DEFAULT 'morno',
  origin text NOT NULL DEFAULT 'web',
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  deal_value numeric,
  ai_insights text,
  last_contact_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Lead activities table
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Lead notes table
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content text NOT NULL,
  author text NOT NULL DEFAULT 'Admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies for leads
CREATE POLICY "Authenticated can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- RLS policies for lead_activities
CREATE POLICY "Authenticated can read lead_activities" ON public.lead_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert lead_activities" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lead_activities" ON public.lead_activities FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lead_activities" ON public.lead_activities FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- RLS policies for lead_notes
CREATE POLICY "Authenticated can read lead_notes" ON public.lead_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert lead_notes" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lead_notes" ON public.lead_notes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lead_notes" ON public.lead_notes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on leads
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
