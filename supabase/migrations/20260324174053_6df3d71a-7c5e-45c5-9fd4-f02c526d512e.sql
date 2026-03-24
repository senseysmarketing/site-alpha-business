INSERT INTO public.site_settings (key, value) VALUES
  ('instagram_posts', '{"urls": ["", "", "", "", "", ""]}'::jsonb)
ON CONFLICT (key) DO NOTHING;