DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.visits_scheduling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_code text NOT NULL,
  broker_name text NOT NULL,
  visit_date date NOT NULL,
  visit_time text NOT NULL,
  lead_name text NOT NULL,
  lead_phone text NOT NULL,
  lead_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE POLICY "Anyone can create visit scheduling"
  ON public.visits_scheduling FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Admins can read visits"
  ON public.visits_scheduling FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin'::public.app_role));
