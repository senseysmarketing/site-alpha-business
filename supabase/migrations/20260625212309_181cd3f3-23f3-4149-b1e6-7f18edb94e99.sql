
-- Adicionar trigger para reatribuições de leads (UPDATE de assigned_user_id)
CREATE OR REPLACE FUNCTION public.notify_lead_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net'
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
        'lead_id', NEW.id,
        'event', 'reassigned'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'notify_lead_reassignment failed for lead %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_lead_reassignment ON public.leads;
CREATE TRIGGER trg_notify_lead_reassignment
AFTER UPDATE OF assigned_user_id ON public.leads
FOR EACH ROW
WHEN (OLD.assigned_user_id IS DISTINCT FROM NEW.assigned_user_id)
EXECUTE FUNCTION public.notify_lead_reassignment();

-- Garantir que trigger de INSERT existe
DROP TRIGGER IF EXISTS trg_notify_new_lead ON public.leads;
CREATE TRIGGER trg_notify_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_lead();

-- Limpar campo recipients obsoleto das configurações
UPDATE public.site_settings
SET value = value - 'recipients'
WHERE key = 'lead_email_notifications';
