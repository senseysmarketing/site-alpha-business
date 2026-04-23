-- 1. Create blog_categories table
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog categories are publicly readable"
  ON public.blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert blog categories"
  ON public.blog_categories FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog categories"
  ON public.blog_categories FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog categories"
  ON public.blog_categories FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed existing categories (preserve slugs used by blog_posts)
INSERT INTO public.blog_categories (slug, label, sort_order) VALUES
  ('inside-alphaville', 'Inside Alphaville', 1),
  ('arquitetura-design', 'Arquitetura & Design', 2),
  ('investimento', 'Investimento', 3),
  ('guia-condominios', 'Guia de Condomínios', 4);

-- 3. Convert blog_posts.category from enum to text (preserves data)
ALTER TABLE public.blog_posts
  ALTER COLUMN category TYPE text USING category::text;

-- 4. Drop the now-unused enum type
DROP TYPE IF EXISTS public.blog_category;