
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_settings"
  ON public.site_settings FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage site_settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"video_url": "", "fallback_image": "", "title": "Viver é uma arte.", "subtitle": "Encontre sua obra-prima em Alphaville."}'::jsonb),
  ('design_tokens', '{"accent_color": "#2A070C", "background_color": "#F5F0EB", "secondary_color": "#8B7D6B"}'::jsonb),
  ('featured_property', '{"property_id": "", "custom_label": "Destaque"}'::jsonb),
  ('lifestyle_categories', '{"categories": [{"title": "Mansões Modernas", "subtitle": "Arquitetura contemporânea", "image": ""}, {"title": "Vida em Família", "subtitle": "Residenciais completos", "image": ""}, {"title": "Refúgios Sustentáveis", "subtitle": "Luxo e natureza", "image": ""}]}'::jsonb),
  ('team', '{"members": [{"name": "Wilson Roberto", "role": "CEO & Fundador", "creci": "", "photo": ""}, {"name": "Rafael Albuquerque", "role": "Diretor Comercial", "creci": "", "photo": ""}]}'::jsonb),
  ('contact', '{"phone": "", "email": "", "instagram": "", "address": ""}'::jsonb),
  ('footer', '{"copyright_text": "Alpha Business © 2025", "tagline": ""}'::jsonb);
