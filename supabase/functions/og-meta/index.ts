// Public, read-only live SEO/Open Graph metadata for /imovel/* and /blog/* + live sitemap.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildPropertyUrl } from "../_shared/property-url.ts";
import { resolveMeta, sitemapXml } from "./resolve.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  const url = new URL(req.url);
  try {
    if (url.searchParams.get("sitemap")) {
      const xml = await sitemapXml(db, buildPropertyUrl);
      return new Response(xml, { headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    }
    const path = url.searchParams.get("path") ?? "";
    if (!path.startsWith("/") || path.length > 500) {
      return new Response(JSON.stringify({ error: "invalid path" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const result = await resolveMeta(db, path);
    console.log("og-meta", path, result.status, `${Date.now() - t0}ms`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.error("og-meta failed", String(e));
    return new Response(JSON.stringify({ status: "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
