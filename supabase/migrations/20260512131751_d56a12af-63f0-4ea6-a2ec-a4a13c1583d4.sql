INSERT INTO site_settings (key, value) 
VALUES 
  ('homepage_carousel_2', '{"title": "Oportunidades Únicas", "property_ids": [], "is_active": false}'),
  ('homepage_carousel_3', '{"title": "Destaques da Semana", "property_ids": [], "is_active": false}')
ON CONFLICT (key) DO NOTHING;