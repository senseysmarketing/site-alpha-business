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
  const type = slugify(property.property_type, "imovel");
  const transaction = String(property.transaction_type ?? "").toLowerCase();

  if (transaction === "locacao" || transaction === "aluguel") {
    return `${type}-para-locacao`;
  }

  if (transaction === "ambos") {
    return `${type}-venda-e-locacao`;
  }

  return `${type}-a-venda`;
}

export function buildCondominiumSlug(property: PropertyUrlSource): string {
  return slugify(
    property.condominium || property.neighborhood || property.city,
    "alphaville",
  );
}

function numberToken(value: number | string | null | undefined, suffix: string): string {
  if (value == null || value === "") return "";
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return `${Math.round(parsed)}${suffix}`;
}

function buildMainSlug(property: PropertyUrlSource): string {
  const code = normalizePropertyCode(property.code);
  const location = property.condominium || property.neighborhood || property.city || "";
  const titleSlug = slugify(property.title, "");
  const titleHasRooms = /\b(suite|suites|quarto|quartos|dormitorio|dormitorios)\b/.test(titleSlug);
  const titleHasArea = /\d+\s*m2|\d+m2/.test(titleSlug);
  const pieces = [
    property.title,
    titleHasRooms ? "" : numberToken(property.bedrooms, "suites"),
    titleHasArea ? "" : numberToken(property.area_total, "m2"),
    location,
    property.city,
  ].filter(Boolean);

  const base = slugify(pieces.join(" "), "imovel");
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
