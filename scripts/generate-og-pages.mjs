import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const DIST_DIR = path.resolve("dist");
const INDEX_HTML_PATH = path.join(DIST_DIR, "index.html");
const DEFAULT_SITE_URL = "https://rafaelalbuquerque.com.br";
const DEFAULT_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/528b0591-838e-4694-a846-24ed46939ad4/id-preview-cb84959c--0cf186fb-f62f-4492-936b-578d232fdcce.lovable.app-1775861065200.png";
const PAGE_SIZE = 1000;

const PROPERTY_COLUMNS = [
  "id",
  "code",
  "title",
  "description",
  "condominium",
  "neighborhood",
  "city",
  "property_type",
  "transaction_type",
  "price",
  "rental_price",
  "bedrooms",
  "bathrooms",
  "parking_spots",
  "area_total",
  "photos",
].join(",");

const BLOG_POST_COLUMNS = [
  "slug",
  "title",
  "subtitle",
  "excerpt",
  "cover_image",
  "published_at",
].join(",");

function loadEnvFile() {
  const envPath = path.resolve(".env");
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    const value = rawValue.trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
}

function siteUrl() {
  return (
    process.env.VITE_SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function fetchAllPages(queryFactory) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await queryFactory().range(from, to);
    if (error) throw new Error(error.message);

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripMarkup(value) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ");
}

function cleanText(value) {
  return stripMarkup(value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value, fallback = "imovel") {
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

function normalizePropertyCode(code) {
  return String(code ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

function buildPropertyCategory(property) {
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

function buildCondominiumSlug(property) {
  return slugify(
    property.condominium || property.neighborhood || property.city,
    "alphaville",
  );
}

function numberToken(value, suffix) {
  if (value == null || value === "") return "";
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return `${Math.round(parsed)}${suffix}`;
}

function buildPropertyUrl(property) {
  const code = normalizePropertyCode(property.code);
  if (!code && property.id) {
    return `/imovel/${property.id}`;
  }

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
  const slug = codeSlug && !base.endsWith(`-${codeSlug}`) && base !== codeSlug
    ? `${base}-${codeSlug}`
    : base;

  return `/imovel/${buildPropertyCategory(property)}/${buildCondominiumSlug(property)}/${slug}`;
}

function truncate(value, maxLength = 220) {
  if (value.length <= maxLength) return value;

  const clipped = value.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 120 ? lastSpace : clipped.length).trim()}...`;
}

function titleCaseFallback(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";

  return cleaned
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s|[-/])(\p{L})/gu, (match, prefix, letter) => {
      return `${prefix}${letter.toLocaleUpperCase("pt-BR")}`;
    });
}

function formatCurrency(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function absoluteUrl(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.startsWith("//")) return `https:${cleaned}`;
  if (cleaned.startsWith("/")) return `${siteUrl()}${cleaned}`;
  return `${siteUrl()}/${cleaned.replace(/^\/+/, "")}`;
}

function firstMediaUrl(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const cleaned = cleanText(value);
    if (!cleaned) return "";

    try {
      return firstMediaUrl(JSON.parse(cleaned));
    } catch {
      return cleaned;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstMediaUrl(item);
      if (url) return url;
    }
    return "";
  }

  if (typeof value === "object") {
    return firstMediaUrl(value.url || value.src || value.path || value.publicUrl);
  }

  return "";
}

function propertyPrice(property) {
  const transaction = cleanText(property.transaction_type).toLocaleLowerCase("pt-BR");
  const value = transaction === "locacao" || transaction === "aluguel"
    ? property.rental_price
    : property.price;

  return formatCurrency(value);
}

function propertyDescription(property) {
  const explicitDescription = truncate(cleanText(property.description));
  if (explicitDescription) return explicitDescription;

  const location = [
    cleanText(property.condominium),
    cleanText(property.neighborhood),
    cleanText(property.city),
  ].filter(Boolean).join(", ");

  const details = [
    property.bedrooms ? `${property.bedrooms} quartos` : "",
    property.bathrooms ? `${property.bathrooms} banheiros` : "",
    property.parking_spots ? `${property.parking_spots} vagas` : "",
    property.area_total ? `${property.area_total}m2` : "",
  ].filter(Boolean).join(", ");

  const price = propertyPrice(property);
  const pieces = [
    titleCaseFallback(property.property_type) || "Imovel exclusivo",
    location ? `em ${location}` : "em Alphaville",
    details ? `com ${details}` : "",
    price ? `Valor: ${price}` : "",
  ].filter(Boolean);

  return truncate(`${pieces.join(". ")}. Curadoria Alpha Business.`);
}

function propertyMeta(property) {
  const title = titleCaseFallback(property.title) || "Imovel exclusivo em Alphaville";
  const route = buildPropertyUrl(property);
  const image = absoluteUrl(firstMediaUrl(property.photos));
  const description = propertyDescription(property);
  const canonical = `${siteUrl()}${route}`;

  return {
    title: `${title} | Alpha Business`,
    description,
    canonical,
    ogType: "website",
    image,
    jsonLd: propertyJsonLd(property, { title, description, canonical, image }),
  };
}

function propertyJsonLd(property, meta) {
  const transaction = cleanText(property.transaction_type).toLocaleLowerCase("pt-BR");
  const numericPrice = transaction === "locacao" || transaction === "aluguel"
    ? property.rental_price
    : property.price;
  const hasPrice = typeof numericPrice === "number" && Number.isFinite(numericPrice);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
    image: meta.image,
    identifier: normalizePropertyCode(property.code) || property.id,
    address: {
      "@type": "PostalAddress",
      addressLocality: cleanText(property.city) || undefined,
      addressRegion: "SP",
      addressCountry: "BR",
    },
    floorSize: property.area_total
      ? {
          "@type": "QuantitativeValue",
          value: property.area_total,
          unitCode: "MTK",
        }
      : undefined,
    numberOfRooms: property.bedrooms || undefined,
    offers: {
      "@type": "Offer",
      url: meta.canonical,
      price: hasPrice ? numericPrice : undefined,
      priceCurrency: hasPrice ? "BRL" : undefined,
      availability: "https://schema.org/InStock",
    },
  };
}

function blogMeta(post) {
  const title = cleanText(post.title) || "Blog Alpha Business";
  const description =
    truncate(cleanText(post.subtitle) || cleanText(post.excerpt) || "Insights sobre mercado imobiliario, arquitetura, design e vida em Alphaville.");
  const route = `/blog/${encodeURIComponent(post.slug)}`;

  return {
    title: `${title} | Alpha Business`,
    description,
    canonical: `${siteUrl()}${route}`,
    ogType: "article",
    image: absoluteUrl(post.cover_image),
  };
}

function metaBlock(meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonical);
  const image = escapeHtml(meta.image);

  const tags = [
    `    <title>${title}</title>`,
    `    <meta name="description" content="${description}" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    `    <meta property="og:type" content="${escapeHtml(meta.ogType)}" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:title" content="${title}" />`,
    `    <meta property="og:description" content="${description}" />`,
    `    <meta property="og:image" content="${image}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${title}" />`,
    `    <meta name="twitter:description" content="${description}" />`,
    `    <meta name="twitter:image" content="${image}" />`,
  ];

  if (meta.jsonLd) {
    const json = JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c");
    tags.push(`    <script type="application/ld+json">${json}</script>`);
  }

  return tags.join("\n");
}

function removeManagedMeta(html) {
  const managedMetaNames = [
    "description",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ].join("|");
  const managedMetaProperties = [
    "og:type",
    "og:url",
    "og:title",
    "og:description",
    "og:image",
  ].join("|");

  return html
    .replace(/\s*<title>[\s\S]*?<\/title>\s*/i, "\n")
    .replace(/\s*<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi, "\n")
    .replace(/\s*<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi, "\n")
    .replace(new RegExp(`\\s*<meta\\b(?=[^>]*\\bname=["'](?:${managedMetaNames})["'])[^>]*>\\s*`, "gi"), "\n")
    .replace(new RegExp(`\\s*<meta\\b(?=[^>]*\\bproperty=["'](?:${managedMetaProperties})["'])[^>]*>\\s*`, "gi"), "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function withMeta(html, meta) {
  const cleanedHtml = removeManagedMeta(html);
  const viewportPattern = /(<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>\s*)/i;
  if (viewportPattern.test(cleanedHtml)) {
    return cleanedHtml.replace(viewportPattern, `$1\n${metaBlock(meta)}\n`);
  }

  return cleanedHtml.replace("</head>", `${metaBlock(meta)}\n  </head>`);
}

function writeRouteHtml(routePath, html) {
  const segments = routePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  const outputDir = path.join(DIST_DIR, ...segments);
  const fileName = segments.at(-1);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
  if (fileName && segments.length > 1) {
    writeFileSync(path.join(DIST_DIR, ...segments.slice(0, -1), `${fileName}.html`), html, "utf8");
  }
}

function sitemapUrl(loc, priority = "0.7") {
  return [
    "  <url>",
    `    <loc>${escapeHtml(`${siteUrl()}${loc}`)}</loc>`,
    "    <changefreq>weekly</changefreq>",
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function writeSitemap(properties, posts) {
  const urls = [
    sitemapUrl("/", "1.0"),
    sitemapUrl("/busca", "0.8"),
    sitemapUrl("/blog", "0.7"),
    ...properties.map((property) => sitemapUrl(buildPropertyUrl(property), "0.9")),
    ...posts
      .filter((post) => cleanText(post.slug))
      .map((post) => sitemapUrl(`/blog/${encodeURIComponent(post.slug)}`, "0.6")),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");

  writeFileSync(path.join(DIST_DIR, "sitemap.xml"), xml, "utf8");
}

async function main() {
  loadEnvFile();

  if (!existsSync(INDEX_HTML_PATH)) {
    throw new Error("dist/index.html not found. Run vite build before generating OG pages.");
  }

  const supabaseUrl = requiredEnv("VITE_SUPABASE_URL");
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseKey) {
    throw new Error("Missing Supabase publishable/anon key for OG generation.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const baseHtml = readFileSync(INDEX_HTML_PATH, "utf8");
  const now = new Date().toISOString();

  const properties = await fetchAllPages(() =>
    supabase
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .eq("status", "ativo")
      .order("updated_at", { ascending: false, nullsFirst: false })
  );

  const posts = await fetchAllPages(() =>
    supabase
      .from("blog_posts")
      .select(BLOG_POST_COLUMNS)
      .lte("published_at", now)
      .order("published_at", { ascending: false })
  );

  for (const property of properties) {
    const html = withMeta(baseHtml, propertyMeta(property));
    writeRouteHtml(buildPropertyUrl(property), html);
    writeRouteHtml(`/imovel/${property.id}`, html);
  }

  for (const post of posts) {
    if (!cleanText(post.slug)) continue;
    writeRouteHtml(`/blog/${post.slug}`, withMeta(baseHtml, blogMeta(post)));
  }

  writeSitemap(properties, posts);

  console.log(`Generated Open Graph HTML pages: ${properties.length} properties, ${posts.length} blog posts.`);
  console.log("Generated sitemap.xml with friendly property URLs.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate Open Graph pages: ${message}`);
  process.exit(1);
});
