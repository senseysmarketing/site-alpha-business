
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_url text := 'https://cnzmxxvqmvhdtyqbqnlf.supabase.co/functions/v1/send-lead-notification';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuem14eHZxbXZoZHR5cWJxbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTkzNDMsImV4cCI6MjA4ODg5NTM0M30.AJjEHqvXoAhTTJdy3SX2_lZ_DmIKi2FMZGJkTPi6ATQ';
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon
      ),
      body := jsonb_build_object(
        'mode', 'auto',
        'lead_id', NEW.id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'notify_new_lead failed for lead %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;
