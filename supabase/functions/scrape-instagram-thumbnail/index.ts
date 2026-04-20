import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "instagram-thumbnails";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function hashUrl(url: string): Promise<string> {
  const data = new TextEncoder().encode(url);
  const buf = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function extractOgImage(pageUrl: string): Promise<string | null> {
  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "text/html",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const html = await res.text();

  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch?.[1]) return decodeHtmlEntities(ogMatch[1]);

  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (twMatch?.[1]) return decodeHtmlEntities(twMatch[1]);

  const ogRev = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogRev?.[1]) return decodeHtmlEntities(ogRev[1]);

  return null;
}

async function persistThumbnail(postUrl: string, cdnUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(cdnUrl);
    if (!imgRes.ok) return null;
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    const hash = await hashUrl(postUrl);
    const filename = `${hash}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, bytes, { upsert: true, contentType });
    if (error) {
      console.error("upload error", error);
      return null;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
  } catch (e) {
    console.error("persistThumbnail failed", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = (await req.json()) as { urls: string[] };

    if (!urls || !Array.isArray(urls)) {
      return new Response(JSON.stringify({ error: "urls array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        if (!url || !url.trim()) return { url, thumbnail: null };
        try {
          const cdnUrl = await extractOgImage(url);
          if (!cdnUrl) return { url, thumbnail: null };

          const persisted = await persistThumbnail(url, cdnUrl);
          // Fallback to CDN URL if persistence fails (graceful degradation)
          return { url, thumbnail: persisted || cdnUrl };
        } catch (e) {
          console.error("scrape error", url, e);
          return { url, thumbnail: null };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
