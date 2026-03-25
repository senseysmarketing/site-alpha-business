import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
          const res = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
              Accept: "text/html",
            },
            redirect: "follow",
          });

          if (!res.ok) return { url, thumbnail: null };

          const html = await res.text();

          // Try og:image first
          const ogMatch = html.match(
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
          );
          if (ogMatch?.[1]) return { url, thumbnail: ogMatch[1] };

          // Try twitter:image
          const twMatch = html.match(
            /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
          );
          if (twMatch?.[1]) return { url, thumbnail: twMatch[1] };

          // Try reversed attribute order (content before property)
          const ogRev = html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
          );
          if (ogRev?.[1]) return { url, thumbnail: ogRev[1] };

          return { url, thumbnail: null };
        } catch {
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
