
-- Função para troca segura de cargo (apenas admins)
CREATE OR REPLACE FUNCTION public.set_user_role(_target uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar cargos.';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;

-- Policies de upload no bucket público blog-media (prefixo team-avatars/)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Team avatars insert'
  ) THEN
    CREATE POLICY "Team avatars insert"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'blog-media'
        AND (storage.foldername(name))[1] = 'team-avatars'
        AND (
          public.has_role(auth.uid(),'admin')
          OR public.has_role(auth.uid(),'gerente')
          OR (storage.foldername(name))[2] = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Team avatars update'
  ) THEN
    CREATE POLICY "Team avatars update"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'blog-media'
        AND (storage.foldername(name))[1] = 'team-avatars'
        AND (
          public.has_role(auth.uid(),'admin')
          OR public.has_role(auth.uid(),'gerente')
          OR (storage.foldername(name))[2] = auth.uid()::text
        )
      );
  END IF;
END $$;
