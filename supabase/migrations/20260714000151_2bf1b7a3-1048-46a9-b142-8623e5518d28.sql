
CREATE OR REPLACE FUNCTION public.set_lead_deal_value_from_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_price numeric;
  v_old_price numeric;
BEGIN
  IF NEW.property_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(price, rental_price) INTO v_new_price
  FROM public.properties WHERE id = NEW.property_id;

  IF v_new_price IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.deal_value IS NULL OR NEW.deal_value = 0 THEN
      NEW.deal_value := v_new_price;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.property_id IS DISTINCT FROM OLD.property_id THEN
      IF NEW.deal_value IS NULL OR NEW.deal_value = 0 THEN
        NEW.deal_value := v_new_price;
      ELSIF OLD.property_id IS NOT NULL THEN
        SELECT COALESCE(price, rental_price) INTO v_old_price
        FROM public.properties WHERE id = OLD.property_id;
        IF v_old_price IS NOT NULL AND NEW.deal_value = v_old_price THEN
          NEW.deal_value := v_new_price;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_lead_deal_value_from_property ON public.leads;
CREATE TRIGGER trg_set_lead_deal_value_from_property
BEFORE INSERT OR UPDATE OF property_id, deal_value ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_deal_value_from_property();
