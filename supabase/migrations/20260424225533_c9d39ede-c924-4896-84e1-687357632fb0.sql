INSERT INTO public.site_settings (key, value)
VALUES ('homepage_featured_properties', '{"property_ids": []}'::jsonb)
ON CONFLICT (key) DO NOTHING;