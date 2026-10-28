ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS social_image_url text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS social_image_url text;

CREATE OR REPLACE FUNCTION public.request_social_image()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','net' AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuem14eHZxbXZoZHR5cWJxbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTkzNDMsImV4cCI6MjA4ODg5NTM0M30.AJjEHqvXoAhTTJdy3SX2_lZ_DmIKi2FMZGJkTPi6ATQ';
  v_changed boolean;
BEGIN
  IF TG_TABLE_NAME = 'properties' THEN
    v_changed := TG_OP = 'INSERT' OR NEW.photos IS DISTINCT FROM OLD.photos;
  ELSE
    v_changed := TG_OP = 'INSERT' OR NEW.cover_image IS DISTINCT FROM OLD.cover_image OR NEW.cover_image_mobile IS DISTINCT FROM OLD.cover_image_mobile;
  END IF;
  IF NOT v_changed THEN RETURN NEW; END IF;
  BEGIN
    PERFORM net.http_post(
      url := 'https://cnzmxxvqmvhdtyqbqnlf.supabase.co/functions/v1/social-image',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || v_anon),
      body := jsonb_build_object('table', TG_TABLE_NAME, 'id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'request_social_image failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_property_social_image AFTER INSERT OR UPDATE OF photos ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.request_social_image();
CREATE TRIGGER trg_blog_social_image AFTER INSERT OR UPDATE OF cover_image, cover_image_mobile ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.request_social_image();