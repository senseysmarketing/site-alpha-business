// Generates a lightweight 1200x630 JPEG share image once per photo/cover change.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { absoluteUrl, DEFAULT_IMAGE, firstMediaUrl } from "../_shared/og-meta.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const db = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const BUCKET = "blog-media";
const MAX_BYTES = 300 * 1024;
const UUID_RE = /^[0-9a-f-]{36}$/i;

async function sha1(v: string) {
  const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

async function fetchBytes(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`fetch ${r.status} ${url}`);
  return { bytes: new Uint8Array(await r.arrayBuffer()), type: r.headers.get("content-type") ?? "" };
}

/** Uses storage transforms (handles HEIC/large files) when possible, then guarantees a small JPEG. */
async function makeJpeg(source: string): Promise<Uint8Array> {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/`;
  let input: { bytes: Uint8Array; type: string };
  if (source.startsWith(prefix)) {
    const path = source.slice(prefix.length);
    input = await fetchBytes(`${SUPABASE_URL}/storage/v1/render/image/public/${path}?width=1200&height=630&resize=cover&quality=72`);
  } else {
    input = await fetchBytes(source);
  }
  if (input.type.includes("jpeg") && input.bytes.length <= MAX_BYTES) return input.bytes;
  const img = await Image.decode(input.bytes);
  img.cover(1200, 630);
  for (const q of [75, 62, 50]) {
    const out = await img.encodeJPEG(q);
    if (out.length <= MAX_BYTES || q === 50) return out;
  }
  throw new Error("unreachable");
}

// deno-lint-ignore no-explicit-any
async function processRow(table: "properties" | "blog_posts", row: any) {
  const source = table === "properties"
    ? absoluteUrl(firstMediaUrl(row.photos))
    : absoluteUrl(row.cover_image || row.cover_image_mobile);
  if (!source || source === DEFAULT_IMAGE) {
    if (row.social_image_url) await db.from(table).update({ social_image_url: null }).eq("id", row.id);
    return { id: row.id, status: "no_image" };
  }
  const hash = await sha1(source);
  if (row.social_image_url?.includes(hash)) return { id: row.id, status: "unchanged" };
  const jpeg = await makeJpeg(source);
  const path = `social/${table === "properties" ? "imoveis" : "noticias"}/${row.id}-${hash}.jpg`;
  const { error: upErr } = await db.storage.from(BUCKET).upload(path, jpeg, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
  if (upErr) throw new Error(`upload: ${upErr.message}`);
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  const { error } = await db.from(table).update({ social_image_url: url }).eq("id", row.id);
  if (error) throw new Error(`update: ${error.message}`);
  return { id: row.id, status: "generated", bytes: jpeg.length };
}

const COLS = { properties: "id, photos, social_image_url", blog_posts: "id, cover_image, cover_image_mobile, social_image_url" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => ({}));
    const table = body.table === "blog_posts" ? "blog_posts" : body.table === "properties" ? "properties" : null;
    if (!table) return json({ error: "table must be properties or blog_posts" }, 400);

    if (body.backfill) {
      const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 25);
      const { data, error } = await db.from(table).select(COLS[table]).is("social_image_url", null).limit(limit);
      if (error) throw error;
      const results = [];
      for (const row of data ?? []) {
        try { results.push(await processRow(table, row)); }
        catch (e) { console.error("social-image backfill", row.id, String(e)); results.push({ id: row.id, status: "error", error: String(e) }); }
      }
      return json({ processed: results.length, results });
    }

    if (typeof body.id !== "string" || !UUID_RE.test(body.id)) return json({ error: "invalid id" }, 400);
    const { data: row, error } = await db.from(table).select(COLS[table]).eq("id", body.id).maybeSingle();
    if (error) throw error;
    if (!row) return json({ error: "not found" }, 404);
    const t0 = Date.now();
    const result = await processRow(table, row);
    console.log("social-image", table, body.id, result.status, `${Date.now() - t0}ms`);
    return json(result);
  } catch (e) {
    console.error("social-image failed", String(e));
    return json({ error: String(e) }, 500);
  }
});
