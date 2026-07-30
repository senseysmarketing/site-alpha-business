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

/* ---------- Static content for crawlers (no JS) ---------- */

function jsonLdBlock(data) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `    <script type="application/ld+json">${json}</script>`;
}

function staticShell(inner, jsonLd) {
  return [
    `    <div id="seo-static" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">`,
    inner,
    `    </div>`,
    jsonLd ? jsonLdBlock(jsonLd) : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function withStaticBody(html, block) {
  if (!block) return html;
  return html.replace('<div id="root"></div>', `${block}\n    <div id="root"></div>`);
}

function propertyTransactionLabel(property) {
  const transaction = cleanText(property.transaction_type).toLocaleLowerCase("pt-BR");
  if (transaction === "locacao" || transaction === "aluguel") return "Locação";
  if (transaction === "ambos") return "Venda e Locação";
  return "Venda";
}

function propertyStaticBlock(property, related) {
  const meta = propertyMeta(property);
  const title = titleCaseFallback(property.title) || "Imóvel exclusivo em Alphaville";
  const image = absoluteUrl(firstMediaUrl(property.photos));
  const description = cleanText(property.description);

  const facts = [
    ["Código", cleanText(property.code)],
    ["Condomínio", cleanText(property.condominium)],
    ["Bairro", cleanText(property.neighborhood)],
    ["Cidade", cleanText(property.city)],
    ["Tipo", titleCaseFallback(property.property_type)],
    ["Negociação", propertyTransactionLabel(property)],
    ["Valor de venda", formatCurrency(property.price)],
    ["Valor de locação", formatCurrency(property.rental_price)],
    ["Suítes/Dormitórios", property.bedrooms ? String(property.bedrooms) : ""],
    ["Banheiros", property.bathrooms ? String(property.bathrooms) : ""],
    ["Vagas", property.parking_spots ? String(property.parking_spots) : ""],
    ["Área total", property.area_total ? `${property.area_total} m²` : ""],
  ].filter(([, value]) => Boolean(value));

  const inner = [
    `      <h1>${escapeHtml(title)}</h1>`,
    `      <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="1200" height="630" />`,
    `      <ul>`,
    ...facts.map(([label, value]) => `        <li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`),
    `      </ul>`,
    description ? `      <p>${escapeHtml(description)}</p>` : "",
    related.length
      ? [
          `      <h2>Outros imóveis</h2>`,
          `      <ul>`,
          ...related.map(
            (item) =>
              `        <li><a href="/imovel/${encodeURIComponent(item.id)}">${escapeHtml(
                titleCaseFallback(item.title) || "Imóvel em Alphaville"
              )}</a></li>`
          ),
          `      </ul>`,
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const priceValue =
    typeof property.price === "number" && property.price > 0
      ? property.price
      : typeof property.rental_price === "number" && property.rental_price > 0
        ? property.rental_price
        : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    url: meta.canonical,
    description: meta.description,
    image: [image],
    ...(cleanText(property.code) ? { sku: cleanText(property.code) } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: cleanText(property.city) || "Santana de Parnaíba",
      addressRegion: "SP",
      addressCountry: "BR",
      ...(cleanText(property.neighborhood) ? { streetAddress: cleanText(property.neighborhood) } : {}),
    },
    ...(property.area_total
      ? {
          floorSize: { "@type": "QuantitativeValue", value: property.area_total, unitCode: "MTK" },
        }
      : {}),
    ...(property.bedrooms ? { numberOfRooms: property.bedrooms } : {}),
    ...(priceValue
      ? {
          offers: {
            "@type": "Offer",
            price: priceValue,
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            url: meta.canonical,
          },
        }
      : {}),
  };

  return staticShell(inner, jsonLd);
}

function blogStaticBlock(post) {
  const meta = blogMeta(post);
  const title = cleanText(post.title) || "Artigo Alpha Business";
  const body = truncate(cleanText(post.content), 5000);

  const inner = [
    `      <h1>${escapeHtml(title)}</h1>`,
    cleanText(post.subtitle) ? `      <h2>${escapeHtml(cleanText(post.subtitle))}</h2>` : "",
    post.cover_image
      ? `      <img src="${escapeHtml(absoluteUrl(post.cover_image))}" alt="${escapeHtml(title)}" />`
      : "",
    body ? `      <p>${escapeHtml(body)}</p>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: meta.description,
    url: meta.canonical,
    image: [meta.image],
    datePublished: post.published_at,
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    author: { "@type": "Organization", name: "Alpha Business" },
    publisher: { "@type": "Organization", name: "Alpha Business" },
  };

  return staticShell(inner, jsonLd);
}

/* ---------- Sitemap + static index ---------- */

function sitemapXml(entries) {
  const urls = entries.map((entry) =>
    [
      "  <url>",
      `    <loc>${escapeHtml(`${siteUrl()}${entry.path}`)}</loc>`,
      entry.lastmod ? `    <lastmod>${escapeHtml(entry.lastmod)}</lastmod>` : null,
      entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
      entry.priority ? `    <priority>${entry.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

function isoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function writeSitemap(properties, posts) {
  const entries = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/busca", changefreq: "daily", priority: "0.9" },
    { path: "/blog", changefreq: "weekly", priority: "0.7" },
    { path: "/imoveis-indice", changefreq: "daily", priority: "0.6" },
    ...properties.map((property) => ({
      path: `/imovel/${encodeURIComponent(property.id)}`,
      lastmod: isoDate(property.updated_at),
      changefreq: "weekly",
      priority: "0.8",
    })),
    ...posts
      .filter((post) => cleanText(post.slug))
      .map((post) => ({
        path: `/blog/${encodeURIComponent(post.slug)}`,
        lastmod: isoDate(post.updated_at) || isoDate(post.published_at),
        changefreq: "monthly",
        priority: "0.6",
      })),
  ];

  writeFileSync(path.join(DIST_DIR, "sitemap.xml"), sitemapXml(entries), "utf8");
  return entries.length;
}

function writeStaticIndex(baseHtml, properties, posts) {
  const meta = {
    title: "Índice de imóveis | Alpha Business",
    description:
      "Lista completa dos imóveis disponíveis em Alphaville e região, curados por Rafael Albuquerque | Alpha Business.",
    canonical: `${siteUrl()}/imoveis-indice`,
    ogType: "website",
    image: DEFAULT_IMAGE,
  };

  const inner = [
    `      <h1>Índice de imóveis</h1>`,
    `      <ul>`,
    ...properties.map(
      (property) =>
        `        <li><a href="/imovel/${encodeURIComponent(property.id)}">${escapeHtml(
          `${cleanText(property.code) ? `${cleanText(property.code)} — ` : ""}${
            titleCaseFallback(property.title) || "Imóvel em Alphaville"
          }`
        )}</a></li>`
    ),
    `      </ul>`,
    `      <h2>Artigos</h2>`,
    `      <ul>`,
    ...posts
      .filter((post) => cleanText(post.slug))
      .map(
        (post) =>
          `        <li><a href="/blog/${encodeURIComponent(post.slug)}">${escapeHtml(
            cleanText(post.title) || post.slug
          )}</a></li>`
      ),
    `      </ul>`,
  ].join("\n");

  const html = withStaticBody(withMeta(baseHtml, meta), staticShell(inner, null));
  const outputDir = path.join(DIST_DIR, "imoveis-indice");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
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

  const allProperties = await fetchAllPages(() =>
    supabase
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .eq("status", "ativo")
      .order("updated_at", { ascending: false, nullsFirst: false })
  );

  const allPosts = await fetchAllPages(() =>
    supabase
      .from("blog_posts")
      .select(BLOG_POST_COLUMNS)
      .lte("published_at", now)
      .order("published_at", { ascending: false })
  );

  const posts = allPosts.filter((post) => cleanText(post.slug));
  const properties = allProperties.slice(0, Math.max(0, MAX_PRERENDER_PAGES - posts.length));

  if (properties.length < allProperties.length) {
    console.warn(
      `Prerender cap reached: ${properties.length}/${allProperties.length} properties rendered (MAX_PRERENDER_PAGES=${MAX_PRERENDER_PAGES}).`
    );
  }

  for (const [index, property] of properties.entries()) {
    const related = properties
      .filter((item, itemIndex) => itemIndex !== index && item.condominium === property.condominium)
      .slice(0, 6);
    const fallbackRelated = related.length
      ? related
      : properties.filter((_, itemIndex) => itemIndex !== index).slice(0, 6);

    const html = withStaticBody(
      withMeta(baseHtml, propertyMeta(property)),
      propertyStaticBlock(property, fallbackRelated)
    );
    writeRouteHtml("imovel", property.id, html);
  }

  for (const post of posts) {
    const html = withStaticBody(withMeta(baseHtml, blogMeta(post)), blogStaticBlock(post));
    writeRouteHtml("blog", post.slug, html);
  }

  writeStaticIndex(baseHtml, allProperties, posts);
  const sitemapEntries = writeSitemap(allProperties, posts);

  console.log(
    `Generated ${properties.length} property pages, ${posts.length} blog pages, static index and sitemap (${sitemapEntries} URLs).`
  );
}


main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate Open Graph pages: ${message}`);
  process.exit(1);
});
