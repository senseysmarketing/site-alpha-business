ALTER TABLE public.team_profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

UPDATE public.team_profiles SET last_seen_at = updated_at WHERE last_seen_at IS NULL;

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.team_profiles
  SET last_seen_at = now()
  WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;