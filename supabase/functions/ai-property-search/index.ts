import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Utils ----------
const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set([
  "a","o","os","as","um","uma","de","do","da","dos","das","no","na","nos","nas",
  "em","para","por","com","sem","e","ou","que","ao","aos","à","às","seu","sua",
  "meu","minha","mais","menos","ate","até","entre","the","of","com",
  "casa","apartamento","apto","ap","cobertura","mansao","mansão","imovel","imóvel",
  "quero","procuro","busco","tem","ter","perto","proximo","próximo","preciso","gostaria",
]);

const tokenize = (s: string): string[] => {
  const n = norm(s);
  if (!n) return [];
  return n.split(" ").filter((t) => t.length >= 2 && !STOPWORDS.has(t));
};

interface ParsedFilters {
  price_min: number | null;
  price_max: number | null;
  bedrooms_min: number | null;
  bathrooms_min: number | null;
  parking_min: number | null;
  area_min: number | null;
  condominium: string | null;
  transaction_type: string | null; // 'venda' | 'locacao'
  qualitative_terms: string[];
}

const parseMoney = (raw: string): number | null => {
  // Aceita "5", "5m", "5mi", "5 milhoes", "500k", "500 mil", "1.200.000", "1,2 milhoes"
  let s = raw.trim().toLowerCase().replace(/r\$\s*/g, "");
  const milhao = /(milhoes|milhao|milhões|milhão|\bmi\b|\bm\b)/.test(s);
  const mil = /(\bmil\b|\bk\b)/.test(s);
  s = s.replace(/(milhoes|milhao|milhões|milhão|mi|m|mil|k)/g, "").trim();
  // remove pontos de milhar e troca virgula por ponto
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  if (!isFinite(n)) return null;
  if (milhao) return Math.round(n * 1_000_000);
  if (mil) return Math.round(n * 1_000);
  // Heurística: se menor que 1000 sem unidade, presume milhões (ex: "5")
  if (n < 1000) return Math.round(n * 1_000_000);
  return Math.round(n);
};

const parseFilters = (query: string): ParsedFilters => {
  const q = query.toLowerCase();
  const n = norm(query);
  const f: ParsedFilters = {
    price_min: null, price_max: null, bedrooms_min: null, bathrooms_min: null,
    parking_min: null, area_min: null, condominium: null, transaction_type: null,
    qualitative_terms: [],
  };

  // Transaction
  if (/\b(alug|loca|loca[cç][aã]o|para alugar|aluguel)/.test(n)) f.transaction_type = "locacao";
  else if (/\b(vend|comprar|venda|a venda|à venda)/.test(n)) f.transaction_type = "venda";

  // Price ranges
  const moneyRe = /([\d.,]+)\s*(milhoes|milhao|milhões|milhão|mi|m|mil|k)?/gi;
  const between = q.match(/entre\s+([\d.,]+\s*(?:milhoes|milhao|milhões|milhão|mi|m|mil|k)?)\s+(?:e|a|até|ate)\s+([\d.,]+\s*(?:milhoes|milhao|milhões|milhão|mi|m|mil|k)?)/i);
  if (between) {
    const a = parseMoney(between[1]); const b = parseMoney(between[2]);
    if (a && b) { f.price_min = Math.min(a, b); f.price_max = Math.max(a, b); }
  } else {
    const ate = q.match(/(?:ate|até|abaixo de|menos de|no maximo|no máximo|m[aá]x(?:imo)?(?:\s+de)?)\s+(r\$\s*)?([\d.,]+\s*(?:milhoes|milhao|milhões|milhão|mi|m|mil|k)?)/i);
    if (ate) { const v = parseMoney(ate[2]); if (v) f.price_max = v; }
    const min = q.match(/(?:acima de|mais de|a partir de|m[ií]n(?:imo)?(?:\s+de)?)\s+(r\$\s*)?([\d.,]+\s*(?:milhoes|milhao|milhões|milhão|mi|m|mil|k)?)/i);
    if (min) { const v = parseMoney(min[2]); if (v) f.price_min = v; }
  }

  // Bedrooms / suites
  const bed = n.match(/(\d+)\s*(suites|suite|quartos|quarto|dormitorios|dormitorio)/);
  if (bed) f.bedrooms_min = parseInt(bed[1], 10);

  const bath = n.match(/(\d+)\s*(banheiros|banheiro|lavabos|lavabo)/);
  if (bath) f.bathrooms_min = parseInt(bath[1], 10);

  const park = n.match(/(\d+)\s*(vagas|vaga|garagens|garagem)/);
  if (park) f.parking_min = parseInt(park[1], 10);

  const area = n.match(/(?:acima de|mais de|a partir de|min(?:imo)? de)?\s*(\d{2,5})\s*(?:m2|m²|metros)/);
  if (area) f.area_min = parseInt(area[1], 10);

  // Qualitative
  const QUAL = [
    "piscina","churrasqueira","gourmet","adega","home theater","automacao","automação",
    "mobiliada","mobiliado","reformada","reformado","face norte","piso aquecido",
    "vista","sauna","spa","pe direito duplo","pé direito duplo","escritorio","escritório",
    "elevador","jardim","quintal","sustentavel","sustentável","luxo","alto padrao","alto padrão",
  ];
  for (const term of QUAL) {
    if (n.includes(norm(term))) f.qualitative_terms.push(term);
  }

  return f;
};

// ---------- Scoring ----------
interface PropertyRow {
  id: string; code: string; title: string; description: string | null;
  property_type: string; transaction_type: string;
  condominium: string | null; neighborhood: string | null; city: string | null; address: string | null;
  price: number | null; rental_price: number | null;
  bedrooms: number | null; bathrooms: number | null; parking_spots: number | null;
  area_total: number | null; area_built: number | null;
  engineering_highlights: string[] | null; photos: string[] | null;
  status: string | null; is_featured: boolean | null;
}

interface ScoredMatch {
  prop: PropertyRow;
  score: number;
  reasons: string[];
}

const buildHaystack = (p: PropertyRow): string => {
  const parts = [
    p.code, p.title, p.description, p.property_type, p.transaction_type,
    p.condominium, p.neighborhood, p.city, p.address,
    ...(p.engineering_highlights ?? []),
  ];
  return norm(parts.filter(Boolean).join(" | "));
};

const scoreProperty = (
  p: PropertyRow,
  query: string,
  filters: ParsedFilters,
): ScoredMatch | null => {
  const queryNorm = norm(query);
  const tokens = tokenize(query);
  const haystack = buildHaystack(p);
  const reasons: string[] = [];
  let score = 0;
  let hasAnyMatch = false;

  // Exact code match (super strong)
  if (queryNorm && norm(p.code) === queryNorm) {
    return { prop: p, score: 1000, reasons: [`Código exato ${p.code}`] };
  }
  if (queryNorm && haystack.includes(norm(p.code)) && p.code.length >= 4) {
    score += 200; hasAnyMatch = true; reasons.push(`Código ${p.code}`);
  }

  // Transaction filter
  if (filters.transaction_type) {
    if (p.transaction_type === filters.transaction_type) {
      score += 40;
    } else {
      // Wrong transaction type — heavy penalty (effectively excludes)
      score -= 500;
    }
  }

  // Condominium match
  if (p.condominium) {
    const condoNorm = norm(p.condominium);
    if (queryNorm.includes(condoNorm) || condoNorm.includes(queryNorm)) {
      score += 120; hasAnyMatch = true; reasons.push(`Condomínio ${p.condominium}`);
    } else {
      // partial token match on condo
      const condoTokens = tokenize(p.condominium);
      const overlap = condoTokens.filter((t) => tokens.includes(t)).length;
      if (overlap > 0) {
        score += 40 * overlap; hasAnyMatch = true; reasons.push(`Condomínio ${p.condominium}`);
      }
    }
  }

  // Neighborhood / city
  for (const field of [p.neighborhood, p.city]) {
    if (!field) continue;
    const fNorm = norm(field);
    if (queryNorm.includes(fNorm)) {
      score += 30; hasAnyMatch = true; reasons.push(field);
    }
  }

  // Token matches in haystack (title/description/highlights)
  const titleNorm = norm(p.title);
  let tokenHits = 0;
  for (const t of tokens) {
    if (titleNorm.includes(t)) { score += 10; tokenHits++; }
    else if (haystack.includes(t)) { score += 4; tokenHits++; }
  }
  if (tokenHits > 0) hasAnyMatch = true;

  // Price filter
  const effectivePrice =
    filters.transaction_type === "locacao"
      ? p.rental_price
      : p.price ?? p.rental_price;
  if (filters.price_max != null && effectivePrice != null) {
    if (effectivePrice <= filters.price_max) score += 25;
    else score -= 200;
  }
  if (filters.price_min != null && effectivePrice != null) {
    if (effectivePrice >= filters.price_min) score += 15;
    else score -= 200;
  }

  // Bedrooms / bathrooms / parking / area
  if (filters.bedrooms_min != null) {
    if ((p.bedrooms ?? 0) >= filters.bedrooms_min) {
      score += 20; reasons.push(`${p.bedrooms} dormitórios`);
    } else score -= 100;
  }
  if (filters.bathrooms_min != null) {
    if ((p.bathrooms ?? 0) >= filters.bathrooms_min) score += 10;
    else score -= 60;
  }
  if (filters.parking_min != null) {
    if ((p.parking_spots ?? 0) >= filters.parking_min) score += 10;
    else score -= 60;
  }
  if (filters.area_min != null) {
    const area = p.area_total ?? p.area_built ?? 0;
    if (area >= filters.area_min) score += 15;
    else score -= 80;
  }

  // Qualitative term matches
  for (const term of filters.qualitative_terms) {
    if (haystack.includes(norm(term))) {
      score += 12; hasAnyMatch = true;
      if (!reasons.includes(term)) reasons.push(term);
    } else {
      score -= 5;
    }
  }

  // Featured bonus
  if (p.is_featured) score += 5;

  // Photos bonus (small)
  if (p.photos && p.photos.length > 0) score += 1;

  // Determine if this match has any positive signal
  const hasFilterSignal =
    filters.condominium != null ||
    filters.transaction_type != null ||
    filters.bedrooms_min != null ||
    filters.bathrooms_min != null ||
    filters.parking_min != null ||
    filters.area_min != null ||
    filters.price_min != null ||
    filters.price_max != null ||
    filters.qualitative_terms.length > 0;

  if (!hasAnyMatch && !hasFilterSignal) return null;
  if (score <= 0) return null;

  return { prop: p, score, reasons: reasons.slice(0, 4) };
};

const buildReason = (m: ScoredMatch): string => {
  if (m.reasons.length === 0) return "Compatível com a sua busca.";
  return m.reasons.join(" · ");
};

const propertyToResult = (p: PropertyRow, reason: string) => ({
  id: p.id,
  code: p.code,
  title: p.title,
  condominium: p.condominium,
  neighborhood: p.neighborhood,
  city: p.city,
  price: p.price,
  rental_price: p.rental_price,
  transaction_type: p.transaction_type,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  area_total: p.area_total,
  photo: p.photos?.[0] || null,
  relevance_reason: reason,
});

const deterministicSearch = (
  properties: PropertyRow[],
  query: string,
  filters: ParsedFilters,
  limit = 24,
) => {
  const trimmed = query.trim();
  if (!trimmed && Object.values(filters).every((v) => v == null || (Array.isArray(v) && v.length === 0))) {
    // Generic: return featured + recent
    const sorted = [...properties].sort((a, b) => Number(b.is_featured ?? 0) - Number(a.is_featured ?? 0));
    return sorted.slice(0, limit).map((p) => propertyToResult(p, p.is_featured ? "Imóvel em destaque" : "Compatível com a sua busca."));
  }

  const scored: ScoredMatch[] = [];
  for (const p of properties) {
    const m = scoreProperty(p, query, filters);
    if (m) scored.push(m);
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((m) => propertyToResult(m.prop, buildReason(m)));
};

// ---------- Handler ----------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));
    const q = typeof query === "string" ? query : "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: properties, error } = await supabase
      .from("properties")
      .select(
        "id, code, title, description, property_type, transaction_type, condominium, neighborhood, city, address, price, rental_price, bedrooms, bathrooms, parking_spots, area_total, area_built, engineering_highlights, photos, status, is_featured",
      )
      .eq("status", "ativo")
      .limit(2000);

    if (error) {
      console.error("DB error:", error);
      return new Response(
        JSON.stringify({ error: "Falha ao consultar imóveis." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const safeProperties = (properties || []) as PropertyRow[];
    const filters = parseFilters(q);

    // Always run deterministic search — guarantees results work without AI credits.
    const results = deterministicSearch(safeProperties, q, filters, 24);

    return new Response(
      JSON.stringify({ results, parsed_filters: filters }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-property-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
