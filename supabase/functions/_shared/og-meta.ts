// Shared SEO/Open Graph rules for live (non-build) previews.
// Mirrors scripts/generate-og-pages.mjs so live and static output match.
import { buildPropertyUrl } from "./property-url.ts";

export const SITE_URL = "https://rafaelalbuquerque.com.br";
export const DEFAULT_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/528b0591-838e-4694-a846-24ed46939ad4/id-preview-cb84959c--0cf186fb-f62f-4492-936b-578d232fdcce.lovable.app-1775861065200.png";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Meta {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  image: string;
  imageOptimized?: boolean;
  robots?: string;
  jsonLd?: unknown;
}

export const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const cleanText = (v: unknown) =>
  String(v ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const truncate = (v: string, max = 220) => {
  if (v.length <= max) return v;
  const c = v.slice(0, max - 1);
  const s = c.lastIndexOf(" ");
  return `${c.slice(0, s > 120 ? s : c.length).trim()}...`;
};

const titleCase = (v: unknown) => {
  const c = cleanText(v);
  return c ? c.toLocaleLowerCase("pt-BR").replace(/(^|\s|[-/])(\p{L})/gu, (_m, p, l) => `${p}${l.toLocaleUpperCase("pt-BR")}`) : "";
};

const brl = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
    : "";

export const absoluteUrl = (v: unknown) => {
  const c = cleanText(v);
  if (!c) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(c)) return c;
  if (c.startsWith("//")) return `https:${c}`;
  return `${SITE_URL}/${c.replace(/^\/+/, "")}`;
};

export const firstMediaUrl = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") {
    const c = cleanText(v);
    try { return firstMediaUrl(JSON.parse(c)); } catch { return c; }
  }
  if (Array.isArray(v)) { for (const i of v) { const u = firstMediaUrl(i); if (u) return u; } return ""; }
  if (typeof v === "object") { const o = v as Record<string, unknown>; return firstMediaUrl(o.url || o.src || o.path || o.publicUrl); }
  return "";
};

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

const isRent = (p: Row) => ["locacao", "aluguel"].includes(cleanText(p.transaction_type).toLocaleLowerCase("pt-BR"));

export function propertyDescription(p: Row) {
  const d = truncate(cleanText(p.description));
  if (d) return d;
  const loc = [p.condominium, p.neighborhood, p.city].map(cleanText).filter(Boolean).join(", ");
  const det = [
    p.bedrooms ? `${p.bedrooms} quartos` : "",
    p.bathrooms ? `${p.bathrooms} banheiros` : "",
    p.parking_spots ? `${p.parking_spots} vagas` : "",
    p.area_total ? `${p.area_total}m2` : "",
  ].filter(Boolean).join(", ");
  const price = brl(isRent(p) ? p.rental_price : p.price);
  const parts = [titleCase(p.property_type) || "Imovel exclusivo", loc ? `em ${loc}` : "em Alphaville", det ? `com ${det}` : "", price ? `Valor: ${price}` : ""].filter(Boolean);
  return truncate(`${parts.join(". ")}. Curadoria Alpha Business.`);
}

export function propertyMeta(p: Row): Meta {
  const title = titleCase(p.title) || "Imovel exclusivo em Alphaville";
  const canonical = `${SITE_URL}${buildPropertyUrl(p)}`;
  const image = p.social_image_url || absoluteUrl(firstMediaUrl(p.photos));
  const description = propertyDescription(p);
  const n = isRent(p) ? p.rental_price : p.price;
  const hasPrice = typeof n === "number" && Number.isFinite(n);
  return {
    title: `${title} | Alpha Business`,
    description,
    canonical,
    ogType: "website",
    image,
    imageOptimized: Boolean(p.social_image_url),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: title,
      description,
      url: canonical,
      image,
      identifier: String(p.code ?? "").toUpperCase() || p.id,
      address: { "@type": "PostalAddress", addressLocality: cleanText(p.city) || undefined, addressRegion: "SP", addressCountry: "BR" },
      floorSize: p.area_total ? { "@type": "QuantitativeValue", value: p.area_total, unitCode: "MTK" } : undefined,
      numberOfRooms: p.bedrooms || undefined,
      offers: { "@type": "Offer", url: canonical, price: hasPrice ? n : undefined, priceCurrency: hasPrice ? "BRL" : undefined, availability: "https://schema.org/InStock" },
    },
  };
}

export function blogMeta(post: Row): Meta {
  const title = cleanText(post.title) || "Notícias Alpha Business";
  const description = truncate(cleanText(post.subtitle) || cleanText(post.excerpt) || "Insights sobre mercado imobiliario, arquitetura, design e vida em Alphaville.");
  const canonical = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const image = post.social_image_url || absoluteUrl(post.cover_image || post.cover_image_mobile);
  return {
    title: `${title} | Alpha Business`,
    description,
    canonical,
    ogType: "article",
    image,
    imageOptimized: Boolean(post.social_image_url),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: title,
      description,
      image,
      url: canonical,
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at || undefined,
      author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined,
    },
  };
}

export function unavailableMeta(kind: "property" | "post" | "missing", fallbackPath = "/busca"): Meta {
  const label = kind === "property" ? "Imóvel indisponível" : kind === "post" ? "Notícia indisponível" : "Página não encontrada";
  return {
    title: `${label} | Alpha Business`,
    description: kind === "property"
      ? "Este imóvel não está mais disponível. Veja outras opções de alto padrão em Alphaville e região com a Alpha Business."
      : "Conteúdo indisponível. Conheça os imóveis e notícias da Alpha Business em Alphaville.",
    canonical: `${SITE_URL}${fallbackPath}`,
    ogType: "website",
    image: DEFAULT_IMAGE,
    robots: "noindex, follow",
  };
}

/** Head tags managed by previews. Exactly one of each. */
export function metaTags(m: Meta) {
  const t = escapeHtml(m.title), d = escapeHtml(m.description), c = escapeHtml(m.canonical), i = escapeHtml(m.image);
  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${c}" />`,
    m.robots ? `<meta name="robots" content="${escapeHtml(m.robots)}" />` : "",
    `<meta property="og:type" content="${escapeHtml(m.ogType)}" />`,
    `<meta property="og:url" content="${c}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${i}" />`,
    `<meta property="og:image:secure_url" content="${i}" />`,
    ...(m.imageOptimized
      ? [`<meta property="og:image:type" content="image/jpeg" />`, `<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`]
      : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${i}" />`,
    m.jsonLd ? `<script type="application/ld+json">${JSON.stringify(m.jsonLd).replace(/</g, "\\u003c")}</script>` : "",
  ];
  return tags.filter(Boolean).join("\n");
}

export function staticBlock(m: Meta) {
  return `<div id="seo-static" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap"><h1>${escapeHtml(m.title)}</h1><p>${escapeHtml(m.description)}</p><a href="${escapeHtml(m.canonical)}">${escapeHtml(m.title)}</a></div>`;
}

export type Lookup =
  | { kind: "property"; code?: string; id?: string }
  | { kind: "post"; slug: string }
  | null;

/** Decide which record a public path refers to. */
export function parsePath(rawPath: string): Lookup {
  let path = rawPath.split(/[?#]/)[0];
  try { path = decodeURIComponent(path); } catch { /* keep raw */ }
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "blog" && parts.length === 2) return { kind: "post", slug: parts[1] };
  if (parts[0] !== "imovel" || parts.length < 2) return null;
  const last = parts[parts.length - 1];
  if (parts.length === 2 && UUID_RE.test(last)) return { kind: "property", id: last };
  const m = last.match(/-([a-z0-9]+)$/i) ?? last.match(/^([a-z0-9]+)$/i);
  return m ? { kind: "property", code: m[1].toUpperCase() } : null;
}

export const normalizePath = (p: string) => {
  let v = p.split(/[?#]/)[0];
  try { v = decodeURIComponent(v); } catch { /* raw */ }
  return v.replace(/\/+$/, "") || "/";
};
