CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  category text NOT NULL,
  author_name text NOT NULL DEFAULT 'Alpha Business',
  author_avatar text,
  reading_time_min integer NOT NULL DEFAULT 1,
  is_featured boolean NOT NULL DEFAULT false,
  is_exclusive boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog posts are publicly readable" ON public.blog_posts;
CREATE POLICY "Blog posts are publicly readable"
  ON public.blog_posts FOR SELECT
  USING (published_at <= now());

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1. Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog categories are publicly readable" ON public.blog_categories;
CREATE POLICY "Blog categories are publicly readable"
  ON public.blog_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert blog categories" ON public.blog_categories;
CREATE POLICY "Admins can insert blog categories"
  ON public.blog_categories FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update blog categories" ON public.blog_categories;
CREATE POLICY "Admins can update blog categories"
  ON public.blog_categories FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete blog categories" ON public.blog_categories;
CREATE POLICY "Admins can delete blog categories"
  ON public.blog_categories FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed existing categories (preserve slugs used by blog_posts)
INSERT INTO public.blog_categories (slug, label, sort_order) VALUES
  ('inside-alphaville', 'Inside Alphaville', 1),
  ('arquitetura-design', 'Arquitetura & Design', 2),
  ('investimento', 'Investimento', 3),
  ('guia-condominios', 'Guia de Condomínios', 4)
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

-- 3. Convert blog_posts.category from enum to text (preserves data)
ALTER TABLE public.blog_posts
  ALTER COLUMN category TYPE text USING category::text;

-- 4. Drop the now-unused enum type
DROP TYPE IF EXISTS public.blog_category;
