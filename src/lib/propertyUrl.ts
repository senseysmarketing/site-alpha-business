const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROPERTY_CODE_RE = /(?:^|-)([a-z]{1,8}\d{2,10})$/i;

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

export function slugify(value: unknown, fallback = "imovel"): string {
  const slug = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || fallback;
}

export function normalizePropertyCode(code: unknown): string {
  return String(code ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

export function isLegacyPropertyId(value: unknown): boolean {
  return UUID_RE.test(String(value ?? ""));
}

export function extractPropertyCodeFromSlug(slug: unknown): string | null {
  const lastSegment = decodeURIComponent(String(slug ?? "").split("/").filter(Boolean).pop() ?? "");
  const normalizedSegment = slugify(lastSegment, "");
  const match = normalizedSegment.match(PROPERTY_CODE_RE);
  return match ? normalizePropertyCode(match[1]) : null;
}

export function buildPropertyCategory(property: PropertyUrlSource): string {
  const type = slugify(property.property_type, "");
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
  return `${pluralByType[type] ?? "imoveis"}-em-${buildPropertySeoRegion(property)}`;
}

export function buildPropertySeoRegion(property: PropertyUrlSource): string {
  const location = slugify(
    [property.region, property.condominium, property.neighborhood, property.city]
      .filter(Boolean)
      .join(" "),
    "",
  );

  const isGranjaViana = ["granja-viana", "cotia", "carapicuiba"].some((term) =>
    location.includes(term),
  );
  return isGranjaViana ? "granja-viana" : "alphaville";
}

export function buildCondominiumSlug(property: PropertyUrlSource): string {
  return slugify(
    property.condominium || property.neighborhood || property.city,
    "alphaville",
  );
}

function buildMainSlug(property: PropertyUrlSource): string {
  const code = normalizePropertyCode(property.code);
  const base = slugify(property.title, "imovel");
  const codeSlug = slugify(code, "");

  if (!codeSlug) {
    return base;
  }

  return base.endsWith(`-${codeSlug}`) || base === codeSlug
    ? base
    : `${base}-${codeSlug}`;
}

export function buildPropertyUrl(property: PropertyUrlSource): string {
  if (!normalizePropertyCode(property.code) && property.id && isLegacyPropertyId(property.id)) {
    return `/imovel/${property.id}`;
  }

  const category = buildPropertyCategory(property);
  const condominium = buildCondominiumSlug(property);
  const slug = buildMainSlug(property);
  return `/imovel/${category}/${condominium}/${slug}`;
}
