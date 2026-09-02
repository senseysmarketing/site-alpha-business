CREATE OR REPLACE FUNCTION public.set_property_normalized_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_bairro text := btrim(coalesce(new.neighborhood, ''));
  v_bairro_norm text;
  v_canonical text;
BEGIN
  -- Fallback: alguns feeds (Kenlo) trazem <Condominio> vazio e o nome do
  -- condomínio somente em <Bairro>. Nesses casos usamos o bairro, exceto
  -- quando ele é um nome genérico de região/cidade.
  IF nullif(btrim(coalesce(new.condominium, '')), '') IS NULL AND v_bairro <> '' THEN
    v_bairro_norm := public.normalize_search_text(v_bairro);
    IF v_bairro_norm NOT IN (
      'alphaville', 'centro', 'barueri', 'santana de parnaiba', 'sao paulo',
      'osasco', 'jandira', 'itapevi', 'cotia', 'carapicuiba', 'aldeia da serra',
      'tambore', 'granja viana', 'melville', 'nao informado', 'bairro nao informado'
    ) THEN
      -- Usa a grafia canônica já existente no catálogo (acentuação correta).
      SELECT p.condominium INTO v_canonical
      FROM public.properties p
      WHERE p.condominium_normalized = v_bairro_norm
        AND p.condominium IS NOT NULL
      GROUP BY p.condominium
      ORDER BY count(*) DESC
      LIMIT 1;

      IF v_canonical IS NULL THEN
        SELECT c.name INTO v_canonical
        FROM public.condominiums c
        WHERE public.normalize_search_text(c.name) = v_bairro_norm
        LIMIT 1;
      END IF;

      new.condominium := coalesce(v_canonical, v_bairro);
    END IF;
  END IF;

  new.condominium_normalized := public.normalize_search_text(new.condominium);
  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_property_normalized_fields ON public.properties;
CREATE TRIGGER trg_set_property_normalized_fields
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.set_property_normalized_fields();