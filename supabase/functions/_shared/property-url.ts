const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PropertyUrlSource {
  id?: string | null;
  code?: string | null;
  title?: string | null;
  property_type?: string | null;
  transaction_type?: string | null;
  condominium?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  area_total?: number | string | null;
  bedrooms?: number | string | null;
  region?: string | null;
}

const slugify = (value: unknown, fallback = "imovel") => {
  const slug = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || fallback;
};

const normalizePropertyCode = (code: unknown) =>
  String(code ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();

export const buildPropertyUrl = (property: PropertyUrlSource) => {
  const code = normalizePropertyCode(property.code);
  if (!code && property.id && UUID_RE.test(property.id)) {
    return `/imovel/${property.id}`;
  }

  const pluralByType: Record<string, string> = {
    apartamento: "apartamentos",
    apartamentos: "apartamentos",
    casa: "casas",
    casas: "casas",
    cobertura: "coberturas",
    coberturas: "coberturas",
    galpao: "galpoes",
    galpoes: "galpoes",
    terreno: "terrenos",
    terrenos: "terrenos",
  };
  const type = pluralByType[slugify(property.property_type, "")] ?? "imoveis";
  const regionSource = slugify(
    [property.region, property.condominium, property.neighborhood, property.city]
      .filter(Boolean)
      .join(" "),
    "",
  );
  const region = ["granja-viana", "cotia", "carapicuiba"].some((term) =>
    regionSource.includes(term),
  )
    ? "granja-viana"
    : "alphaville";
  const condominium = slugify(
    property.condominium || property.neighborhood || property.city,
    "alphaville",
  );
  const base = slugify(property.title, "imovel");
  const codeSlug = slugify(code, "");
  const mainSlug = codeSlug && !base.endsWith(`-${codeSlug}`) && base !== codeSlug
    ? `${base}-${codeSlug}`
    : base;

  return `/imovel/${type}-em-${region}/${condominium}/${mainSlug}`;
};