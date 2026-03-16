
-- Properties table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  property_type text NOT NULL DEFAULT 'casa',
  transaction_type text NOT NULL DEFAULT 'venda',
  condominium text,
  address text,
  city text DEFAULT 'Barueri',
  neighborhood text DEFAULT 'Alphaville',
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  parking_spots integer DEFAULT 0,
  area_total numeric,
  area_built numeric,
  price numeric,
  rental_price numeric,
  status text DEFAULT 'ativo',
  is_featured boolean DEFAULT false,
  engineering_highlights text[],
  photos text[],
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are publicly readable"
  ON public.properties FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete properties"
  ON public.properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true);

-- Storage RLS
CREATE POLICY "Anyone can view property photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'property-photos');

CREATE POLICY "Admins can upload property photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete property photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));
