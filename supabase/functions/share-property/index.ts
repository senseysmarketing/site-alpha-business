import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_ORIGIN = "https://rafaelalbuquerque.com.br";
const BOT_UA_RE =
  /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Applebot|SkypeUriPreview|Pinterest|redditbot|vkShare|Googlebot|bingbot|iframely|Embedly|ia_archiver/i;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const brl = (n: number | null | undefined) => {
  if (!n || n <= 0) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
};

const firstImage = (photos: unknown): string | null => {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const p = photos[0];
  if (typeof p === "string") return p;
  if (p && typeof p === "object") {
    const url = (p as Record<string, unknown>).url ?? (p as Record<string, unknown>).src;
    if (typeof url === "string") return url;
  }
  return null;
};

const redirect = (url: string, status = 302) =>
  new Response(null, { status, headers: { ...corsHeaders, Location: url, "Cache-Control": "public, max-age=300" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const id = url.searchParams.get("id")?.trim();

  if (!code && !id) return redirect(`${SITE_ORIGIN}/busca`);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let query = supabase
    .from("properties")
    .select("id, code, title, condominium, neighborhood, city, bedrooms, area_total, price, rental_price, transaction_type, photos, status")
    .limit(1);
  if (id && UUID_RE.test(id)) query = query.eq("id", id);
  else if (code) query = query.eq("code", code);
  else return redirect(`${SITE_ORIGIN}/busca`);

  const { data: rows, error } = await query;
  const property = rows?.[0];

  if (error || !property || property.status !== "ativo") {
    return redirect(`${SITE_ORIGIN}/busca`);
  }

  const propertyUrl = `${SITE_ORIGIN}/imovel/${property.id}`;
  const ua = req.headers.get("user-agent") ?? "";
  const isBot = BOT_UA_RE.test(ua);

  if (!isBot) return redirect(propertyUrl);

  const isRental = property.transaction_type === "locacao" || property.transaction_type === "aluguel";
  const priceStr = brl(isRental ? property.rental_price : property.price) + (isRental ? "/mês" : "");
  const locationBits = [property.condominium, property.neighborhood, property.city].filter(Boolean);
  const title = `${property.title ?? "Imóvel"} · Cód ${property.code ?? ""}`.trim();
  const descBits: string[] = [];
  if (property.bedrooms) descBits.push(`${property.bedrooms} dorms`);
  if (property.area_total) descBits.push(`${property.area_total}m²`);
  if (priceStr) descBits.push(priceStr);
  if (locationBits.length) descBits.push(locationBits.join(" · "));
  const description = descBits.join(" · ") || "Imóvel de alto padrão em Alphaville.";

  const image = firstImage(property.photos) ?? `${SITE_ORIGIN}/placeholder.svg`;

  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${propertyUrl}">
<meta property="og:type" content="website">
<meta property="og:url" content="${propertyUrl}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta http-equiv="refresh" content="0; url=${propertyUrl}">
</head><body><p>Redirecionando para <a href="${propertyUrl}">${escapeHtml(title)}</a>...</p></body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
});
