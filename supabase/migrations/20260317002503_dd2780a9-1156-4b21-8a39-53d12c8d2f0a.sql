
-- Create blog-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload blog media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-media');

-- Allow public read
CREATE POLICY "Public can read blog media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'blog-media');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can update blog media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blog-media');

CREATE POLICY "Authenticated users can delete blog media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-media');
