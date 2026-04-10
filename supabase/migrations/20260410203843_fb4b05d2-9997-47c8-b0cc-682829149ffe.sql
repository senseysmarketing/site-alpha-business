
-- 1. Expand app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'corretor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistente';

-- 2. Create team_profiles table
CREATE TABLE public.team_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role_display text DEFAULT 'Corretor',
  avatar_url text,
  phone text,
  creci text,
  bio text,
  social_instagram text,
  social_linkedin text,
  availability text NOT NULL DEFAULT 'offline' CHECK (availability IN ('online', 'em_visita', 'offline')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can read team_profiles"
  ON public.team_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert team_profiles"
  ON public.team_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any team_profile"
  ON public.team_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can update own team_profile"
  ON public.team_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete team_profiles"
  ON public.team_profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_team_profiles_updated_at
  BEFORE UPDATE ON public.team_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create storage bucket for team documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-documents', 'team-documents', false);

-- Storage RLS policies
CREATE POLICY "Admins can view all team documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'team-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view own team documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'team-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload team documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'team-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can upload own team documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'team-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
