import { buildPropertyUrl } from "../_shared/property-url.ts";
import {
  blogMeta, escapeHtml, Meta, metaTags, normalizePath, parsePath, propertyMeta, SITE_URL, staticBlock, unavailableMeta,
} from "../_shared/og-meta.ts";

export const PROPERTY_COLS =
  "id,code,title,description,condominium,neighborhood,city,property_type,transaction_type,price,rental_price,bedrooms,bathrooms,parking_spots,area_total,photos,status,social_image_url,updated_at";
export const POST_COLS = "slug,title,subtitle,excerpt,cover_image,cover_image_mobile,social_image_url,author_name,published_at,updated_at";

export type Result =
  | { status: "ok" | "inactive" | "not_found"; httpStatus: number; meta: Meta; tags: string; staticHtml: string }
  | { status: "moved"; httpStatus: 301; location: string }
  | { status: "skip" };

const pack = (status: "ok" | "inactive" | "not_found", meta: Meta, httpStatus = 200): Result =>
  ({ status, httpStatus, meta, tags: metaTags(meta), staticHtml: staticBlock(meta) });

// deno-lint-ignore no-explicit-any
type Db = any;

export async function resolveMeta(db: Db, path: string, now = new Date()): Promise<Result> {
  const lookup = parsePath(path);
  if (!lookup) return { status: "skip" };

  if (lookup.kind === "post") {
    const { data, error } = await db.from("blog_posts").select(POST_COLS).eq("slug", lookup.slug).maybeSingle();
    if (error) throw error;
    if (!data) return pack("not_found", unavailableMeta("missing", "/blog"), 404);
    if (new Date(data.published_at) > now) return pack("inactive", unavailableMeta("post", "/blog"));
    return pack("ok", blogMeta(data));
  }

  let q = db.from("properties").select(PROPERTY_COLS);
  q = lookup.id ? q.eq("id", lookup.id) : q.ilike("code", lookup.code);
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return pack("not_found", unavailableMeta("missing"), 404);
  if (data.status !== "ativo") return pack("inactive", unavailableMeta("property"));
  const canonicalPath = buildPropertyUrl(data);
  if (normalizePath(path) !== normalizePath(canonicalPath)) {
    return { status: "moved", httpStatus: 301, location: canonicalPath };
  }
  return pack("ok", propertyMeta(data));
}

async function all(db: Db, table: string, cols: string, apply: (q: Db) => Db) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await apply(db.from(table).select(cols)).range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

const iso = (v: unknown) => { const d = new Date(String(v ?? "")); return Number.isNaN(d.getTime()) ? "" : d.toISOString(); };

// deno-lint-ignore no-explicit-any
export async function sitemapXml(db: Db, urlFor: (p: any) => string) {
  const now = new Date().toISOString();
  const props = await all(db, "properties", PROPERTY_COLS, (q) => q.eq("status", "ativo").order("updated_at", { ascending: false }));
  const posts = await all(db, "blog_posts", POST_COLS, (q) => q.lte("published_at", now).order("published_at", { ascending: false }));
  const entries = [
    { loc: "/", freq: "daily", pri: "1.0" },
    { loc: "/busca", freq: "daily", pri: "0.9" },
    { loc: "/blog", freq: "weekly", pri: "0.7" },
    { loc: "/imoveis-indice", freq: "daily", pri: "0.6" },
    ...props.map((p) => ({ loc: urlFor(p), mod: iso(p.updated_at), freq: "weekly", pri: "0.9" })),
    ...posts.filter((p) => p.slug).map((p) => ({ loc: `/blog/${encodeURIComponent(p.slug)}`, mod: iso(p.updated_at) || iso(p.published_at), freq: "monthly", pri: "0.6" })),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) => `  <url>\n    <loc>${escapeHtml(SITE_URL + e.loc)}</loc>\n${"mod" in e && e.mod ? `    <lastmod>${e.mod}</lastmod>\n` : ""}    <changefreq>${e.freq}</changefreq>\n    <priority>${e.pri}</priority>\n  </url>`),
    "</urlset>",
  ].join("\n");
}
