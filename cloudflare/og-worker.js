// Cloudflare Worker — live SEO/Open Graph for rafaelalbuquerque.com.br
// Routes: rafaelalbuquerque.com.br/imovel/*, rafaelalbuquerque.com.br/blog/*, rafaelalbuquerque.com.br/sitemap.xml
// Paste into Cloudflare > Workers. Not deployed by Lovable. See cloudflare/README.md.
// Same HTML for every visitor (no user-agent sniffing). Any failure => original Lovable response.

const META_URL = "https://cnzmxxvqmvhdtyqbqnlf.supabase.co/functions/v1/og-meta";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuem14eHZxbXZoZHR5cWJxbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTkzNDMsImV4cCI6MjA4ODg5NTM0M30.AJjEHqvXoAhTTJdy3SX2_lZ_DmIKi2FMZGJkTPi6ATQ";
const TIMEOUT_MS = 1500;
const META_TTL = 60;

async function cachedFetch(url, ctx, ttl, timeout) {
  const cache = caches.default;
  const key = new Request(url);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(url, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`meta ${res.status}`);
  const copy = new Response(res.body, res);
  copy.headers.set("Cache-Control", `public, max-age=${ttl}`);
  ctx.waitUntil(cache.put(key, copy.clone()));
  return copy;
}

const remove = { element: (el) => el.remove() };
const MANAGED_META = /^(description|robots|twitter:(card|title|description|image))$/;
const MANAGED_PROP = /^og:/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return fetch(request);

    if (url.pathname === "/sitemap.xml") {
      try {
        const res = await cachedFetch(`${META_URL}?sitemap=1`, ctx, 3600, 8000);
        const out = new Response(res.body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600", "x-og-source": "live" } });
        return out;
      } catch (e) {
        console.log("sitemap fallback", String(e));
        return fetch(request);
      }
    }

    const metaPromise = cachedFetch(`${META_URL}?path=${encodeURIComponent(url.pathname)}`, ctx, META_TTL, TIMEOUT_MS)
      .then((r) => r.json())
      .catch((e) => { console.log("meta fallback", url.pathname, String(e)); return null; });

    const meta = await metaPromise;
    if (meta?.status === "moved" && meta.location) {
      return Response.redirect(`${url.origin}${meta.location}${url.search}`, 301);
    }

    const origin = await fetch(request);
    const type = origin.headers.get("content-type") || "";
    if (!meta || !meta.tags || !type.includes("text/html") || origin.status >= 500) {
      const passthrough = new Response(origin.body, origin);
      passthrough.headers.set("x-og-source", "fallback");
      return passthrough;
    }

    const headers = new Headers(origin.headers);
    headers.set("x-og-source", "live");
    headers.delete("content-length");
    const shaped = new Response(origin.body, { status: meta.httpStatus || origin.status, headers });

    return new HTMLRewriter()
      .on("head > title", remove)
      .on('link[rel="canonical"]', remove)
      .on('script[type="application/ld+json"]', remove)
      .on("meta[name]", { element: (el) => { if (MANAGED_META.test(el.getAttribute("name") || "")) el.remove(); } })
      .on("meta[property]", { element: (el) => { if (MANAGED_PROP.test(el.getAttribute("property") || "")) el.remove(); } })
      .on("div#seo-static", remove)
      .on("head", { element: (el) => el.append(meta.tags, { html: true }) })
      .on("div#root", { element: (el) => el.before(meta.staticHtml || "", { html: true }) })
      .transform(shaped);
  },
};
