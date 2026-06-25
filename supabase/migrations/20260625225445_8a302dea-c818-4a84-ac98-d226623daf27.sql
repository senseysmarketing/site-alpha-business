
-- properties
DROP POLICY IF EXISTS "Admins can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;

CREATE POLICY "Managers can insert properties" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "Managers can update properties" ON public.properties
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "Managers can delete properties" ON public.properties
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));

-- blog_posts
DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;

CREATE POLICY "Managers can insert blog posts" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "Managers can update blog posts" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "Managers can delete blog posts" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
