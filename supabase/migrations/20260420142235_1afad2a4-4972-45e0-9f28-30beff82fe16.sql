-- Create public bucket for Instagram thumbnails (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('instagram-thumbnails', 'instagram-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Instagram thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'instagram-thumbnails');

-- Admin write access
CREATE POLICY "Admins can upload instagram thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'instagram-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update instagram thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'instagram-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete instagram thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'instagram-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));