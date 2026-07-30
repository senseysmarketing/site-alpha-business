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
// Publish rejects builds over 50k files; each record emits 2 files, so cap well below.
const MAX_PRERENDER_PAGES = Number(process.env.MAX_PRERENDER_PAGES || 8000);

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
  "updated_at",
].join(",");

const BLOG_POST_COLUMNS = [
  "slug",
  "title",
  "subtitle",
  "excerpt",
  "content",
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
  const route = `/imovel/${encodeURIComponent(property.id)}`;
  const image = absoluteUrl(firstMediaUrl(property.photos));

  return {
    title: `${title} | Alpha Business`,
    description: propertyDescription(property),
    canonical: `${siteUrl()}${route}`,
    ogType: "website",
    image,
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

  return [
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
  ].join("\n");
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

function writeRouteHtml(routeType, routeId, html) {
  const safeRouteId = encodeURIComponent(routeId.trim());
  const outputDir = path.join(DIST_DIR, routeType, safeRouteId);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
  writeFileSync(path.join(DIST_DIR, routeType, `${safeRouteId}.html`), html, "utf8");
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
    writeRouteHtml("imovel", property.id, withMeta(baseHtml, propertyMeta(property)));
  }

  for (const post of posts) {
    if (!cleanText(post.slug)) continue;
    writeRouteHtml("blog", post.slug, withMeta(baseHtml, blogMeta(post)));
  }

  console.log(`Generated Open Graph HTML pages: ${properties.length} properties, ${posts.length} blog posts.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate Open Graph pages: ${message}`);
  process.exit(1);
});
