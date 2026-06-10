// AlphaBusiness - AI Property Search (Conversational v2)
// Actions:
//   { action: "converse", message, currentFilters?, history? }     -> v1 (backward compat)
//   { action: "converse_v2", message, currentState?, selectedOption?, history? }
//   { action: "search", filters, limit? }
//   { query: string }                                              -> legacy free text
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================================
// Types
// =====================================================================
type SB = ReturnType<typeof createClient>;

interface PropertySearchFilters {
  code?: string | null;
  transactionType?: "venda" | "locacao" | null;
  propertyType?: string | null;
  condominium?: string | null;
  condominiumGroup?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  minBedrooms?: number | null;
  minBathrooms?: number | null;
  minParking?: number | null;
  minArea?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  highlights?: string[];
}

interface ConversationState {
  filters: PropertySearchFilters;
  lastIntent?: string;
  lastMatchCount?: number;
  refineTurn?: number;
  pendingRefine?: "area" | "bedrooms" | "price" | null;
  lastFiltersSig?: string;
}


interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface OptionChip {
  label: string;
  value: string;
  kind: string;
  action?: string;
  payload?: Record<string, unknown>;
  url?: string;
}

interface PropertyResult {
  id: string;
  code: string;
  title: string;
  condominium: string | null;
  neighborhood: string | null;
  city: string | null;
  price: number | null;
  rental_price: number | null;
  transaction_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  area_total: number | null;
  photo: string | null;
  relevance_reason: string;
}

interface ConversationLink {
  label: string;
  url: string;
  type: "search" | "property" | "whatsapp";
}

interface CondominiumBreakdownItem {
  label: string;
  condominium: string;
  count: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  url?: string;
}

type Intent =
  | "greeting"
  | "small_talk"
  | "new_search"
  | "update_filter"
  | "broaden_search"
  | "show_results"
  | "show_property"
  | "ask_availability"
  | "ask_no_results_reason"
  | "ask_condominium_breakdown"
  | "ask_property_detail"
  | "reset_search";

// =====================================================================
// Utils
// =====================================================================
const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const fmtBRL = (n: number | null | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "Sob consulta";

const filtersToQS = (f: PropertySearchFilters): string => {
  const p = new URLSearchParams();
  if (f.transactionType) p.set("transactionType", f.transactionType);
  if (f.propertyType) p.set("propertyType", f.propertyType);
  if (f.condominium) p.set("condominium", f.condominium);
  if (f.city) p.set("city", f.city);
  if (f.neighborhood) p.set("neighborhood", f.neighborhood);
  if (f.minBedrooms) p.set("minBedrooms", String(f.minBedrooms));
  if (f.minBathrooms) p.set("minBathrooms", String(f.minBathrooms));
  if (f.minParking) p.set("minParking", String(f.minParking));
  if (f.minArea) p.set("minArea", String(f.minArea));
  if (f.minPrice) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
  return p.toString();
};

const buildSearchUrl = (f: PropertySearchFilters): string => {
  const qs = filtersToQS(f);
  return qs ? `/busca?${qs}` : "/busca";
};

// =====================================================================
// Parsing (deterministic)
// =====================================================================
const CODE_REGEX = /\b([A-Z]{2,3}\d{3,6})\b/i;

const extractCode = (message: string): string | null => {
  const m = message.match(CODE_REGEX);
  return m ? m[1].toUpperCase() : null;
};

const parseMoneyToken = (raw: string): number | null => {
  let s = raw.trim().toLowerCase().replace(/r\$\s*/g, "");
  const isMilhao = /(milhoes|milhao|milhões|milhão|\bmi\b|\bmilh\b)/.test(s);
  const isMil = /(\bmil\b|\bk\b)/.test(s);
  const isMeio = /\b(e\s+meio|meio)\b/.test(s);
  s = s.replace(/(milhoes|milhao|milhões|milhão|mi|milh|mil|k|e meio|meio)/g, "").trim();
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  if (!isFinite(n)) return null;
  let value = n;
  if (isMilhao) value = n * 1_000_000;
  else if (isMil) value = n * 1_000;
  if (isMeio && isMilhao) value += 500_000;
  return Math.round(value);
};

interface PriceParseResult {
  minPrice?: number;
  maxPrice?: number;
  ambiguousValue?: number;
}

const parsePrice = (message: string): PriceParseResult => {
  const q = message.toLowerCase();
  const between = q.match(
    /entre\s+([\d.,]+\s*(?:milhoes|milhao|milhões|milhão|mi|milh|mil|k|e\s+meio|meio)?)\s+(?:e|a|até|ate)\s+([\d.,]+\s*(?:milhoes|milhao|milhões|milhão|mi|milh|mil|k|e\s+meio|meio)?)/i,
  );
  if (between) {
    const a = parseMoneyToken(between[1]);
    const b = parseMoneyToken(between[2]);
    if (a && b) return { minPrice: Math.min(a, b), maxPrice: Math.max(a, b) };
  }
  const ate = q.match(
    /(?:ate|até|abaixo de|menos de|no maximo|no máximo|m[aá]x(?:imo)?(?:\s+de)?)\s+(?:r\$\s*)?([\d.,]+(?:\s*e\s+meio)?\s*(?:milhoes|milhao|milhões|milhão|mi|milh|mil|k|meio)?)/i,
  );
  if (ate) {
    const tok = ate[1].trim();
    const hasUnit = /(milhoes|milhao|milhões|milhão|mi|milh|mil|k|meio)/i.test(tok);
    const v = parseMoneyToken(tok);
    if (v) {
      if (!hasUnit && v < 10000) return { ambiguousValue: v };
      return { maxPrice: v };
    }
  }
  const min = q.match(
    /(?:acima de|mais de|a partir de|m[ií]n(?:imo)?(?:\s+de)?)\s+(?:r\$\s*)?([\d.,]+(?:\s*e\s+meio)?\s*(?:milhoes|milhao|milhões|milhão|mi|milh|mil|k|meio)?)/i,
  );
  if (min) {
    const v = parseMoneyToken(min[1]);
    if (v) return { minPrice: v };
  }
  return {};
};

const findCondoNumber = (message: string): { group: string; number: number } | null => {
  const n = norm(message);
  const m = n.match(/\b(tambore|alphaville|residencial)\s+(\d{1,2})\b/);
  if (m) return { group: m[1], number: parseInt(m[2], 10) };
  return null;
};

const findCondoGroup = (message: string): string | null => {
  const n = norm(message);
  const m = n.match(/\b(tambore|alphaville|residencial)\b/);
  return m ? m[1] : null;
};

const parseTransaction = (message: string): "venda" | "locacao" | null => {
  const n = norm(message);
  if (/\b(alug|loca|locacao|arrend)/.test(n)) return "locacao";
  if (/\b(comprar|comprando|compra|vender|venda|adquirir)/.test(n)) return "venda";
  return null;
};

const PROPERTY_TYPES: { re: RegExp; value: string }[] = [
  { re: /\b(apartamento|apto|aptos|apartamentos)\b/i, value: "apartamento" },
  { re: /\b(cobertura|coberturas)\b/i, value: "cobertura" },
  { re: /\b(sobrado|sobrados)\b/i, value: "sobrado" },
  { re: /\b(terreno|terrenos|lote|lotes)\b/i, value: "terreno" },
  { re: /\b(casa|casas)\b/i, value: "casa" },
];

const parsePropertyType = (message: string): string | null => {
  for (const { re, value } of PROPERTY_TYPES) if (re.test(message)) return value;
  return null;
};

const parseBedrooms = (message: string): number | null => {
  const n = norm(message);
  const m = n.match(/(\d{1,2})\s*(suites?|quartos?|dormitorios?|dorms?)/);
  if (m) return parseInt(m[1], 10);
  return null;
};

const AREA_UNIT_RE = /(m2|m²|metros?\s*quadrados?|metros?)\b/i;
const parseArea = (message: string, opts?: { pending?: boolean }): number | null => {
  const n = norm(message);
  // "X metros", "X m²", "X metros quadrados"
  const m1 = n.match(/(\d{2,5})\s*(?:m2|metros? quadrados?|metros?)\b/);
  if (m1) return parseInt(m1[1], 10);
  // "a partir de N", "no mínimo N", "acima de N", "pelo menos N" (com unidade)
  const m2 = n.match(/(?:a partir de|no minimo|acima de|pelo menos|min(?:imo)?(?:\s+de)?)\s+(\d{2,5})\s*(?:m2|metros? quadrados?|metros?)\b/);
  if (m2) return parseInt(m2[1], 10);
  // pending refine de área: aceita número puro (ex: "750")
  if (opts?.pending) {
    const m3 = n.match(/^\s*(\d{2,5})\s*$/);
    if (m3) {
      const v = parseInt(m3[1], 10);
      if (v >= 30) return v;
    }
  }
  return null;
};

const stripAreaTokens = (message: string): string =>
  message.replace(/(\d{2,5})\s*(?:m2|m²|metros? quadrados?|metros?)\b/gi, " ");

const HIGHLIGHT_KEYWORDS: Record<string, string[]> = {
  piscina: ["piscina"],
  gourmet: ["gourmet", "churrasqueira"],
  jardim: ["jardim", "quintal"],
  vista: ["vista"],
  reformado: ["reformado", "reformada", "novo", "nova"],
  mobiliado: ["mobiliado", "mobiliada"],
};

const parseHighlights = (message: string): string[] => {
  const n = norm(message);
  const out: string[] = [];
  for (const [key, words] of Object.entries(HIGHLIGHT_KEYWORDS)) {
    if (words.some((w) => n.includes(w))) out.push(key);
  }
  return out;
};

// =====================================================================
// Condo resolver (using condominium_normalized + aliases)
// =====================================================================
let condoCache: { list: { name: string; normalized: string }[]; at: number } | null = null;
const CONDO_CACHE_TTL_MS = 5 * 60 * 1000;

const fetchDistinctCondos = async (sb: SB) => {
  if (condoCache && Date.now() - condoCache.at < CONDO_CACHE_TTL_MS) return condoCache.list;
  const map = new Map<string, string>();
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await sb
      .from("properties")
      .select("condominium, condominium_normalized")
      .eq("status", "ativo")
      .not("condominium", "is", null)
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    for (const r of data as { condominium: string | null; condominium_normalized: string | null }[]) {
      if (r.condominium && !map.has(r.condominium)) {
        map.set(r.condominium, r.condominium_normalized ?? norm(r.condominium));
      }
    }
    if (data.length < 1000) break;
  }
  const list = Array.from(map.entries()).map(([name, normalized]) => ({ name, normalized })).sort((a, b) => a.name.localeCompare(b.name));
  condoCache = { list, at: Date.now() };
  return list;
};

let aliasCache: { map: Map<string, string>; at: number } | null = null;
const fetchAliases = async (sb: SB): Promise<Map<string, string>> => {
  if (aliasCache && Date.now() - aliasCache.at < CONDO_CACHE_TTL_MS) return aliasCache.map;
  const { data } = await sb.from("condominium_aliases").select("alias_normalized, canonical_normalized");
  const map = new Map<string, string>();
  if (data) {
    for (const r of data as { alias_normalized: string; canonical_normalized: string }[]) {
      map.set(r.alias_normalized, r.canonical_normalized);
    }
  }
  aliasCache = { map, at: Date.now() };
  return map;
};

// Resolve "Tamboré 2" → real condominium name in DB, never confusing with 10/11
const resolveCondoByNumber = async (
  sb: SB,
  group: string,
  number: number,
): Promise<string | null> => {
  const condos = await fetchDistinctCondos(sb);
  const aliases = await fetchAliases(sb);
  const groupN = norm(group);
  const queryNorm = `${groupN} ${number}`;
  const canonical = aliases.get(queryNorm);
  const numRe = new RegExp(`(^|\\s)${number}(\\s|$)`);

  // 1) exact match against canonical from aliases table
  if (canonical) {
    const match = condos.find((c) => c.normalized === canonical);
    if (match) return match.name;
  }
  // 2) name contains the group AND the exact number as a token
  const direct = condos.find((c) => c.normalized.includes(groupN) && numRe.test(c.normalized));
  if (direct) return direct.name;
  return null;
};

const findCondosByGroup = async (sb: SB, group: string): Promise<string[]> => {
  const condos = await fetchDistinctCondos(sb);
  const groupN = norm(group);
  return condos.filter((c) => c.normalized.includes(groupN)).map((c) => c.name);
};

// =====================================================================
// Supabase query builders
// =====================================================================
const PROP_SELECT =
  "id, code, title, condominium, condominium_normalized, neighborhood, city, price, rental_price, transaction_type, property_type, bedrooms, bathrooms, parking_spots, area_total, photos, is_featured, engineering_highlights, created_at";

const applyHardFilters = (q: any, f: PropertySearchFilters) => {
  let query = q.eq("status", "ativo");
  if (f.code) query = query.ilike("code", f.code);
  if (f.transactionType) {
    if (f.transactionType === "locacao") query = query.in("transaction_type", ["locacao", "aluguel"]);
    else query = query.eq("transaction_type", f.transactionType);
  }
  if (f.propertyType) query = query.ilike("property_type", `%${f.propertyType}%`);
  if (f.condominium) {
    // accent-insensitive exact match via normalized column (Postgres ilike is accent-sensitive)
    const condoNorm = norm(f.condominium);
    console.log("[applyHardFilters] condominium filter", { raw: f.condominium, normalized: condoNorm });
    query = query.eq("condominium_normalized", condoNorm);
  }
  if (f.city) query = query.ilike("city", `%${f.city}%`);
  if (f.neighborhood) query = query.ilike("neighborhood", `%${f.neighborhood}%`);
  if (f.minBedrooms) query = query.gte("bedrooms", f.minBedrooms);
  if (f.minBathrooms) query = query.gte("bathrooms", f.minBathrooms);
  if (f.minParking) query = query.gte("parking_spots", f.minParking);
  if (f.minArea) query = query.gte("area_total", f.minArea);
  const priceCol = f.transactionType === "locacao" ? "rental_price" : "price";
  if (f.minPrice) query = query.gte(priceCol, f.minPrice);
  if (f.maxPrice) query = query.lte(priceCol, f.maxPrice);
  return query;
};

const countMatches = async (sb: SB, f: PropertySearchFilters): Promise<number> => {
  let q = sb.from("properties").select("id", { count: "exact", head: true });
  q = applyHardFilters(q, f);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
};

const mapRow = (p: any): PropertyResult => ({
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
  parking_spots: p.parking_spots,
  area_total: p.area_total,
  photo: (p.photos && p.photos[0]) || null,
  relevance_reason: p.condominium ?? p.neighborhood ?? "Compatível com sua busca",
});

const fetchTopMatches = async (sb: SB, f: PropertySearchFilters, limit: number): Promise<PropertyResult[]> => {
  let q = sb.from("properties").select(PROP_SELECT);
  q = applyHardFilters(q, f);
  q = q.order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  const { data, error } = await q;
  if (error || !data) return [];
  const scored = (data as any[]).map((p) => {
    let bonus = 0;
    const hl = (p.engineering_highlights ?? []) as string[];
    if (f.highlights && f.highlights.length && hl.length) {
      const hlNorm = hl.map(norm);
      for (const h of f.highlights) {
        if (hlNorm.some((x) => x.includes(norm(h)))) bonus += 5;
      }
    }
    if (p.is_featured) bonus += 3;
    return { p, bonus };
  });
  scored.sort((a, b) => b.bonus - a.bonus);
  return scored.map(({ p }) => mapRow(p));
};

const getPropertyByCode = async (sb: SB, code: string): Promise<PropertyResult | null> => {
  const { data } = await sb.from("properties").select(PROP_SELECT).ilike("code", code).eq("status", "ativo").limit(1);
  if (!data || !data.length) return null;
  return mapRow(data[0]);
};

const getCondominiumBreakdown = async (
  sb: SB,
  baseFilters: PropertySearchFilters,
  groupHint?: string | null,
): Promise<CondominiumBreakdownItem[]> => {
  const filtersNoCond: PropertySearchFilters = { ...baseFilters, condominium: null, condominiumGroup: null };
  let q = sb.from("properties").select("condominium, condominium_normalized, price, rental_price").limit(2000);
  q = applyHardFilters(q, filtersNoCond);
  if (groupHint) {
    q = q.ilike("condominium_normalized", `%${norm(groupHint)}%`);
  }
  const { data } = await q;
  if (!data) return [];
  const groups = new Map<string, { count: number; min: number | null; max: number | null }>();
  for (const r of data as any[]) {
    if (!r.condominium) continue;
    const key = r.condominium as string;
    const isRental = baseFilters.transactionType === "locacao";
    const price = isRental ? r.rental_price : r.price;
    const g = groups.get(key) ?? { count: 0, min: null, max: null };
    g.count++;
    if (typeof price === "number") {
      g.min = g.min === null ? price : Math.min(g.min, price);
      g.max = g.max === null ? price : Math.max(g.max, price);
    }
    groups.set(key, g);
  }
  return Array.from(groups.entries())
    .map(([condominium, v]) => ({
      label: condominium,
      condominium,
      count: v.count,
      minPrice: v.min,
      maxPrice: v.max,
      url: buildSearchUrl({ ...baseFilters, condominium }),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

// =====================================================================
// Intent detection (rules-first, cheap)
// =====================================================================
const detectIntent = (message: string, state: ConversationState): Intent => {
  const n = norm(message);
  if (!n) return "small_talk";
  if (extractCode(message)) return "show_property";
  if (/^(reiniciar|recomecar|comecar de novo|reset|nova busca)/.test(n)) return "reset_search";

  if (/^(oi|ola|bom dia|boa tarde|boa noite|hey|hello)$/.test(n)) return "greeting";
  if (/^(obrigad|valeu|tchau|ate mais)/.test(n)) return "small_talk";

  if (/(me mostre|me mostra|mostra|me mande|me passa|mostrar|ver opcoes|ver os imoveis|ver imoveis|ver resultados|ver tudo|me indica)/.test(n)) {
    return "show_results";
  }
  if (/(quais condominios|quais bairros|breakdown|quais opcoes de condominio|quais regioes|onde tem)/.test(n)) {
    return "ask_condominium_breakdown";
  }
  if (/(nao tem|tem alguma|tem algo|tem casa|tem imovel|tem opcao|existe|disponivel|por que)/.test(n)) {
    return "ask_no_results_reason";
  }
  if (/(amplia|ampliar|aumenta|considera|considere|tambem|alternativ)/.test(n)) {
    return "broaden_search";
  }
  if (/(quero|gostaria|procuro|buscando|preciso|estou olhando|estou querendo)/.test(n)) {
    return "new_search";
  }
  // anything containing a recognizable filter token = update_filter
  if (
    parseTransaction(message) ||
    parsePropertyType(message) ||
    findCondoGroup(message) ||
    parseBedrooms(message) ||
    parseArea(message) !== null ||
    (state.pendingRefine === "area" && parseArea(message, { pending: true }) !== null) ||
    Object.keys(parsePrice(stripAreaTokens(message))).length > 0 ||
    parseHighlights(message).length > 0
  ) {
    return state.lastIntent === "new_search" ? "update_filter" : "new_search";
  }
  return "small_talk";
};

// =====================================================================
// Filter merging + state hydration
// =====================================================================
const mergeFilters = (base: PropertySearchFilters, add: PropertySearchFilters): PropertySearchFilters => {
  const out: PropertySearchFilters = { ...base };
  for (const k of Object.keys(add) as (keyof PropertySearchFilters)[]) {
    const v = (add as any)[k];
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      const existing = Array.isArray((out as any)[k]) ? ((out as any)[k] as string[]) : [];
      (out as any)[k] = Array.from(new Set([...existing, ...v]));
      continue;
    }
    (out as any)[k] = v;
  }
  return out;
};

const hydrateState = (raw: any): ConversationState => {
  if (raw && typeof raw === "object" && raw.filters) {
    return {
      filters: { highlights: [], ...(raw.filters as PropertySearchFilters) },
      lastIntent: raw.lastIntent,
      lastMatchCount: typeof raw.lastMatchCount === "number" ? raw.lastMatchCount : undefined,
    };
  }
  return { filters: { highlights: [] } };
};

// =====================================================================
// Selected option (chip with structured action)
// =====================================================================
const applySelectedOption = (state: ConversationState, opt: OptionChip | undefined) => {
  if (!opt) return;
  const f = state.filters;
  switch (opt.action ?? opt.kind) {
    case "broaden_price": {
      const m = opt.payload?.maxPrice;
      if (typeof m === "number") f.maxPrice = m;
      else if (typeof f.maxPrice === "number") f.maxPrice = Math.round(f.maxPrice * 1.5);
      break;
    }
    case "set_max_price": {
      const m = opt.payload?.maxPrice;
      if (typeof m === "number") f.maxPrice = m;
      break;
    }
    case "set_condominium":
    case "condominium": {
      const c = (opt.payload?.condominium as string) ?? opt.value;
      if (c) {
        f.condominium = c;
        f.condominiumGroup = null;
      }
      break;
    }
    case "any_condo":
    case "clear_condominium": {
      f.condominium = null;
      f.condominiumGroup = null;
      break;
    }
    case "set_transaction":
    case "transaction": {
      if (opt.value === "venda" || opt.value === "locacao") f.transactionType = opt.value;
      break;
    }
    case "set_property_type":
    case "propertyType": {
      if (opt.value) f.propertyType = opt.value;
      break;
    }
    case "set_bedrooms":
    case "bedrooms": {
      const n = parseInt(opt.value, 10);
      if (n) f.minBedrooms = n;
      break;
    }
    case "set_min_area": {
      const n = Number(opt.payload?.minArea ?? opt.value);
      if (Number.isFinite(n) && n > 0) f.minArea = n;
      break;
    }
    case "highlight": {
      const tags = String(opt.value).split(",").map((s) => s.trim()).filter(Boolean);
      f.highlights = Array.from(new Set([...(f.highlights ?? []), ...tags]));
      break;
    }
  }
};

// =====================================================================
// Response builder
// =====================================================================
interface BuildResponseArgs {
  intent: Intent;
  state: ConversationState;
  matchCount?: number;
  preview?: PropertyResult[];
  breakdown?: CondominiumBreakdownItem[];
  property?: PropertyResult | null;
  groupOptions?: string[];
  ambiguousPrice?: number;
}

const defaultStartChips = (): OptionChip[] => [
  { label: "Quero comprar", value: "venda", kind: "transaction", action: "set_transaction" },
  { label: "Quero alugar", value: "locacao", kind: "transaction", action: "set_transaction" },
  { label: "Tenho um código", value: "code", kind: "code" },
];

const summarizeFilters = (f: PropertySearchFilters): string => {
  const parts: string[] = [];
  if (f.transactionType) parts.push(f.transactionType === "venda" ? "compra" : "locação");
  if (f.propertyType) parts.push(f.propertyType);
  if (f.condominium) parts.push(`no ${f.condominium}`);
  else if (f.condominiumGroup) parts.push(`em ${f.condominiumGroup}`);
  if (f.minBedrooms) parts.push(`${f.minBedrooms}+ suítes`);
  if (f.maxPrice) parts.push(`até ${fmtBRL(f.maxPrice)}`);
  if (f.minPrice) parts.push(`acima de ${fmtBRL(f.minPrice)}`);
  return parts.join(", ");
};

const formatPriceCompact = (n: number) => {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (n >= 1_000) return `R$ ${Math.round(n / 1_000)} mil`;
  return fmtBRL(n);
};

// =====================================================================
// Refine chip handler — contextual responses so the chat doesn't loop
// =====================================================================
const REFINE_INTRO_POOL = [
  "Beleza, vamos afinar.",
  "Show, podemos refinar mais.",
  "Perfeito, vou estreitar a busca.",
  "Ok, bora deixar mais certeiro.",
];
const pickIntro = (state: ConversationState) => {
  const n = (state.refineTurn ?? 0) % REFINE_INTRO_POOL.length;
  state.refineTurn = (state.refineTurn ?? 0) + 1;
  return REFINE_INTRO_POOL[n];
};

const handleRefineChip = async (sb: SB, state: ConversationState, opt: OptionChip) => {
  const intro = pickIntro(state);
  const v = opt.value;

  // Escolher condomínio → real breakdown the user can tap
  if (v === "condo") {
    const breakdown = await getCondominiumBreakdown(
      sb,
      { ...state.filters, condominium: null },
      state.filters.condominiumGroup ?? null,
    );
    if (!breakdown.length) {
      return {
        assistantMessage: `${intro} Não encontrei condomínios com esses filtros — quer ampliar a faixa de preço ou trocar o tipo de imóvel?`,
        responseType: "text" as const,
        parsedFilters: state.filters,
        updatedState: state,
        suggestedOptions: [
          { label: "Ampliar preço", value: "broaden_price", kind: "action", action: "broaden_price" } as OptionChip,
          { label: "Considerar apartamentos", value: "apartamento", kind: "propertyType", action: "set_property_type" } as OptionChip,
        ],
        nextAction: "ask" as const,
      };
    }
    return {
      assistantMessage: `${intro} Veja a disponibilidade por condomínio dentro do seu filtro. Toque em um para focar:`,
      responseType: "condominium_breakdown" as const,
      parsedFilters: state.filters,
      updatedState: state,
      breakdown,
      suggestedOptions: [
        ...breakdown.slice(0, 6).map((b) => ({
          label: `${b.condominium} (${b.count})`,
          value: b.condominium,
          kind: "condominium",
          action: "set_condominium",
          payload: { condominium: b.condominium },
        } as OptionChip)),
        { label: "Qualquer condomínio", value: "any", kind: "action", action: "clear_condominium" } as OptionChip,
      ],
      nextAction: "ask" as const,
    };
  }

  // Definir metragem → ask area with concrete chips
  if (v === "area") {
    state.pendingRefine = "area";
    return {
      assistantMessage: `${intro} A partir de quantos m² faz sentido pra você? Pode digitar livremente também (ex: "750 metros").`,
      responseType: "text" as const,
      parsedFilters: state.filters,
      updatedState: state,
      suggestedOptions: [
        { label: "300 m²+", value: "300", kind: "action", action: "set_min_area", payload: { minArea: 300 } } as OptionChip,
        { label: "500 m²+", value: "500", kind: "action", action: "set_min_area", payload: { minArea: 500 } } as OptionChip,
        { label: "800 m²+", value: "800", kind: "action", action: "set_min_area", payload: { minArea: 800 } } as OptionChip,
        { label: "1.000 m²+", value: "1000", kind: "action", action: "set_min_area", payload: { minArea: 1000 } } as OptionChip,
      ],
      nextAction: "ask" as const,
    };
  }

  // Mais suítes → ask bedrooms with concrete chips
  if (v === "bedrooms") {
    state.pendingRefine = "bedrooms";
    return {
      assistantMessage: `${intro} Quantas suítes no mínimo? (pode digitar um número também)`,
      responseType: "text" as const,
      parsedFilters: state.filters,
      updatedState: state,
      suggestedOptions: [
        { label: "3+", value: "3", kind: "action", action: "set_bedrooms" } as OptionChip,
        { label: "4+", value: "4", kind: "action", action: "set_bedrooms" } as OptionChip,
        { label: "5+", value: "5", kind: "action", action: "set_bedrooms" } as OptionChip,
        { label: "6+", value: "6", kind: "action", action: "set_bedrooms" } as OptionChip,
      ],
      nextAction: "ask" as const,
    };
  }

  // Generic "Refinar" / "Refinar busca" → show the refinement palette w/ fresh microcopy
  if (v === "refine") {
    const matchCount = await countMatches(sb, state.filters);
    state.lastMatchCount = matchCount;
    return {
      assistantMessage: `${intro} ${matchCount > 0 ? `Temos **${matchCount}** ${matchCount === 1 ? "imóvel" : "imóveis"} no radar.` : ""} O que pesa mais pra você agora?`,
      responseType: "text" as const,
      parsedFilters: state.filters,
      updatedState: state,
      matchCount,
      suggestedOptions: [
        { label: "Escolher condomínio", value: "condo", kind: "refine" } as OptionChip,
        { label: "Definir metragem", value: "area", kind: "refine" } as OptionChip,
        { label: "Mais suítes", value: "bedrooms", kind: "refine" } as OptionChip,
        { label: "Piscina/Gourmet", value: "piscina,gourmet", kind: "highlight", action: "highlight" } as OptionChip,
        { label: "Ver resultados agora", value: "show_all", kind: "navigate", url: buildSearchUrl(state.filters) } as OptionChip,
      ],
      nextAction: "ask" as const,
    };
  }

  return null;
};

// =====================================================================
// Conversation handler v2
// =====================================================================

const handleConverseV2 = async (sb: SB, body: any) => {
  const message = String(body.message ?? "").trim();
  const state = hydrateState(body.currentState ?? { filters: body.currentFilters ?? { highlights: [] } });
  const selectedOption: OptionChip | undefined = body.selectedOption;

  // 1) Apply structured chip first
  applySelectedOption(state, selectedOption);

  // 1b) Refine chips → respond contextually instead of falling through to default summary
  if (selectedOption && (selectedOption.kind === "refine" || selectedOption.action === "refine")) {
    const refineResp = await handleRefineChip(sb, state, selectedOption);
    if (refineResp) return refineResp;
  }

  // 2) Detect intent
  let intent = detectIntent(message, state);


  // Code shortcut overrides everything
  if (intent === "show_property") {
    const code = extractCode(message)!;
    const prop = await getPropertyByCode(sb, code);
    if (prop) {
      state.filters.code = prop.code;
      state.lastIntent = intent;
      return buildPropertyResponse(prop, state);
    }
    return {
      assistantMessage: `Não localizei o código **${code}** no estoque ativo. Quer me contar o que procura?`,
      responseType: "text" as const,
      parsedFilters: state.filters,
      updatedState: state,
      suggestedOptions: defaultStartChips(),
      nextAction: "ask" as const,
    };
  }

  if (intent === "greeting") {
    return {
      assistantMessage: "Olá! Como posso te ajudar a encontrar o imóvel ideal em Alphaville/Tamboré hoje?",
      responseType: "text" as const,
      parsedFilters: state.filters,
      updatedState: state,
      suggestedOptions: defaultStartChips(),
      nextAction: "ask" as const,
    };
  }

  // 3) Extract filters when intent allows
  if (intent === "new_search" || intent === "update_filter" || intent === "broaden_search" || intent === "ask_availability" || intent === "ask_no_results_reason" || intent === "ask_condominium_breakdown") {
    const det: PropertySearchFilters = {};

    // Área primeiro (evita que "700 metros" seja confundido com R$ 700)
    const area = parseArea(message, { pending: state.pendingRefine === "area" });
    if (area) det.minArea = area;

    // Preço calculado sobre mensagem sem tokens de área
    const priceSource = area ? stripAreaTokens(message) : message;
    const price = parsePrice(priceSource);
    if (price.maxPrice) det.maxPrice = price.maxPrice;
    if (price.minPrice) det.minPrice = price.minPrice;

    if (price.ambiguousValue && !area) {
      return {
        assistantMessage: `Quando você diz **${price.ambiguousValue}**, quer dizer R$ ${price.ambiguousValue} mil ou R$ ${price.ambiguousValue} milhões?`,
        responseType: "clarification" as const,
        parsedFilters: state.filters,
        updatedState: state,
        suggestedOptions: [
          { label: `R$ ${price.ambiguousValue} mil`, value: String(price.ambiguousValue * 1000), kind: "action", action: "set_max_price", payload: { maxPrice: price.ambiguousValue * 1000 } },
          { label: `R$ ${price.ambiguousValue} milhões`, value: String(price.ambiguousValue * 1_000_000), kind: "action", action: "set_max_price", payload: { maxPrice: price.ambiguousValue * 1_000_000 } },
        ],
        clarificationType: "price_unit",
        nextAction: "ask" as const,
      };
    }

    const tx = parseTransaction(message);
    if (tx) det.transactionType = tx;
    const pt = parsePropertyType(message);
    if (pt) det.propertyType = pt;
    const beds = parseBedrooms(message);
    if (beds) det.minBedrooms = beds;
    // pending refine bedrooms: aceita número puro pequeno
    if (!beds && state.pendingRefine === "bedrooms") {
      const m = norm(message).match(/^\s*(\d{1,2})\s*\+?\s*$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= 1 && n <= 15) det.minBedrooms = n;
      }
    }
    const hls = parseHighlights(message);
    if (hls.length) det.highlights = hls;

    const condoNum = findCondoNumber(message);
    if (condoNum) {
      const resolved = await resolveCondoByNumber(sb, condoNum.group, condoNum.number);
      if (resolved) {
        det.condominium = resolved;
        det.condominiumGroup = null;
      } else {
        const groupLabel = condoNum.group === "tambore" ? "Tamboré" : condoNum.group;
        det.condominiumGroup = `${groupLabel.charAt(0).toUpperCase()}${groupLabel.slice(1)} ${condoNum.number}`;
      }
    } else {
      const group = findCondoGroup(message);
      if (group && !state.filters.condominium) {
        det.condominiumGroup = group === "tambore" ? "Tamboré" : group.charAt(0).toUpperCase() + group.slice(1);
      }
    }

    // Se o pipeline determinístico não pegou nada, tenta interpretação por LLM
    const detHasAny = Object.values(det).some((v) => v !== null && v !== undefined && (!Array.isArray(v) || v.length > 0));
    if (!detHasAny && norm(message).split(" ").length >= 2) {
      const llm = await interpretWithLLM(sb, message, state, body.history as ConversationMessage[] | undefined);
      if (llm) {
        Object.assign(det, llm.filters);
        if (llm.intent) intent = llm.intent;
        (body as any)._llmReplyHint = llm.reply;
      }
    }

    state.filters = mergeFilters(state.filters, det);
    // limpa pendingRefine se o filtro alvo foi setado
    if (state.pendingRefine === "area" && det.minArea) state.pendingRefine = null;
    if (state.pendingRefine === "bedrooms" && det.minBedrooms) state.pendingRefine = null;
  }

  // 4) Ambiguous condo group → ask
  if (!state.filters.condominium && state.filters.condominiumGroup) {
    const opts = await findCondosByGroup(sb, state.filters.condominiumGroup);
    if (opts.length > 1) {
      state.lastIntent = intent;
      return {
        assistantMessage: `Existem várias opções em **${state.filters.condominiumGroup}**. Tem alguma preferência?`,
        responseType: "clarification" as const,
        parsedFilters: state.filters,
        updatedState: state,
        suggestedOptions: [
          ...opts.slice(0, 6).map((c) => ({
            label: c,
            value: c,
            kind: "condominium",
            action: "set_condominium",
            payload: { condominium: c },
          } as OptionChip)),
          { label: "Me mostre opções", value: "all", kind: "action", action: "show_group_results" } as OptionChip,
        ],
        clarificationType: "condominium_number",
        nextAction: "ask" as const,
      };
    }
    if (opts.length === 1) state.filters.condominium = opts[0];
  }

  // 5) Decide based on intent + data
  const hasFilter = Object.entries(state.filters).some(([k, v]) => {
    if (k === "highlights") return Array.isArray(v) && (v as string[]).length > 0;
    return v !== null && v !== undefined && v !== "";
  });

  if (!hasFilter && (intent === "small_talk" || intent === "new_search")) {
    return {
      assistantMessage: "Posso te ajudar! Me conta: você quer **comprar** ou **alugar**? Tem algum condomínio ou faixa de preço em mente?",
      responseType: "text" as const,
      parsedFilters: state.filters,
      updatedState: state,
      suggestedOptions: defaultStartChips(),
      nextAction: "ask" as const,
    };
  }

  const matchCount = hasFilter ? await countMatches(sb, state.filters) : 0;
  state.lastMatchCount = matchCount;
  state.lastIntent = intent;

  // 5a) Show results explicitly
  if (intent === "show_results" || intent === "broaden_search" || intent === "update_filter" || intent === "new_search" || intent === "ask_availability") {
    if (matchCount === 0) {
      return await buildNoResultsResponse(sb, state, intent);
    }
    if (matchCount > 60) {
      return buildNarrowDownResponse(state, matchCount);
    }
    const preview = await fetchTopMatches(sb, state.filters, 4);
    return buildResultsResponse(state, matchCount, preview);
  }

  if (intent === "ask_condominium_breakdown") {
    const breakdown = await getCondominiumBreakdown(sb, state.filters, state.filters.condominiumGroup ?? null);
    return {
      assistantMessage: breakdown.length
        ? `Veja a disponibilidade por condomínio (${summarizeFilters(state.filters) || "sem filtros adicionais"}):`
        : "Não encontrei condomínios com esses filtros. Posso ampliar a busca?",
      responseType: "condominium_breakdown" as const,
      parsedFilters: state.filters,
      updatedState: state,
      breakdown,
      suggestedOptions: breakdown.slice(0, 4).map((b) => ({
        label: `${b.condominium} (${b.count})`,
        value: b.condominium,
        kind: "condominium",
        action: "set_condominium",
        payload: { condominium: b.condominium },
      })),
      matchCount,
      nextAction: "ask" as const,
    };
  }

  if (intent === "ask_no_results_reason") {
    if (matchCount > 0) {
      const preview = await fetchTopMatches(sb, state.filters, 4);
      return {
        ...buildResultsResponse(state, matchCount, preview),
        assistantMessage: `Sim! Encontrei **${matchCount}** ${matchCount === 1 ? "imóvel" : "imóveis"} com ${summarizeFilters(state.filters) || "esses filtros"}.`,
      };
    }
    return await buildNoResultsResponse(sb, state, intent);
  }

  // Default: summarize filters and ask next step (varied microcopy to avoid loop)
  const summary = summarizeFilters(state.filters);
  const countTxt = matchCount > 0 ? `**${matchCount}** ${matchCount === 1 ? "imóvel" : "imóveis"}` : "";
  const variants = matchCount > 0
    ? [
        `Atualizei os filtros — agora são ${countTxt}${summary ? ` (${summary})` : ""}. Quer ver ou seguir refinando?`,
        `Pronto, ${countTxt} no radar${summary ? ` para ${summary}` : ""}. Posso mostrar ou afinar mais.`,
        `Tenho ${countTxt} assim. Vamos abrir os resultados?`,
      ]
    : [
        `Não achei nada com ${summary || "esses filtros"}. Quer ampliar a faixa ou trocar de tipo?`,
        `Zero matches para ${summary || "esse perfil"}. Posso relaxar algum filtro?`,
      ];
  const variant = variants[(state.refineTurn ?? 0) % variants.length];
  state.refineTurn = (state.refineTurn ?? 0) + 1;
  return {
    assistantMessage: variant,
    responseType: "text" as const,
    parsedFilters: state.filters,
    updatedState: state,
    suggestedOptions: [
      { label: "Ver resultados", value: "show_all", kind: "action", action: "show_results" },
      { label: "Refinar", value: "refine", kind: "refine" },
    ],
    matchCount,
    links: matchCount > 0 ? [{ label: "Abrir busca completa", url: buildSearchUrl(state.filters), type: "search" as const }] : undefined,
    nextAction: "ask" as const,
  };
};


const buildPropertyResponse = (prop: PropertyResult, state: ConversationState) => {
  const rental = prop.transaction_type === "locacao" || prop.transaction_type === "aluguel";
  const price = rental ? prop.rental_price : prop.price;
  const priceText = price ? `${fmtBRL(price)}${rental ? "/mês" : ""}` : "Sob consulta";
  return {
    assistantMessage: `Encontrei o imóvel **${prop.code}**${prop.condominium ? ` no ${prop.condominium}` : ""} por ${priceText}. Quer ver os detalhes?`,
    responseType: "property_detail" as const,
    parsedFilters: state.filters,
    updatedState: state,
    matchCount: 1,
    resultsPreview: [prop],
    links: [{ label: "Ver detalhes do imóvel", url: `/imovel/${prop.id}`, type: "property" as const }],
    suggestedOptions: [
      { label: "Ver detalhes", value: "view", kind: "navigate", url: `/imovel/${prop.id}` },
      { label: "Nova busca", value: "reset", kind: "reset" },
    ],
    nextAction: "show" as const,
  };
};

const buildResultsResponse = (state: ConversationState, matchCount: number, preview: PropertyResult[]) => ({
  assistantMessage: `Encontrei **${matchCount}** ${matchCount === 1 ? "imóvel" : "imóveis"} com ${summarizeFilters(state.filters) || "esses filtros"}. ${matchCount === 1 ? "Veja abaixo:" : "Aqui vão alguns destaques:"}`,
  responseType: "results_preview" as const,
  parsedFilters: state.filters,
  updatedState: state,
  matchCount,
  resultsPreview: preview,
  links: [{ label: matchCount > preview.length ? `Ver todos os ${matchCount} resultados` : "Abrir busca completa", url: buildSearchUrl(state.filters), type: "search" as const }],
  suggestedOptions: [
    { label: "Ver todos os resultados", value: "show_all", kind: "navigate", url: buildSearchUrl(state.filters) },
    { label: "Refinar busca", value: "refine", kind: "refine" },
  ],
  nextAction: "show" as const,
});

const buildNarrowDownResponse = (state: ConversationState, matchCount: number) => ({
  assistantMessage: `Encontrei cerca de **${matchCount}** imóveis com ${summarizeFilters(state.filters)}. Para mostrar opções mais certeiras, prefere filtrar por condomínio, metragem, suítes ou estilo?`,
  responseType: "text" as const,
  parsedFilters: state.filters,
  updatedState: state,
  suggestedOptions: [
    { label: "Escolher condomínio", value: "condo", kind: "refine" },
    { label: "Definir metragem", value: "area", kind: "refine" },
    { label: "Mais suítes", value: "bedrooms", kind: "refine" },
    { label: "Piscina/Gourmet", value: "piscina,gourmet", kind: "highlight", action: "highlight" },
    { label: "Ver resultados agora", value: "show_all", kind: "navigate", url: buildSearchUrl(state.filters) },
  ],
  matchCount,
  clarificationType: "narrow",
  nextAction: "ask" as const,
});

const buildNoResultsResponse = async (sb: SB, state: ConversationState, intent: Intent) => {
  const f = state.filters;
  // Build alternatives by relaxing one filter at a time
  const alternatives: ConversationLink[] = [];
  const altOptions: OptionChip[] = [];

  // 1) Try same condo without price
  if (f.condominium && f.maxPrice) {
    const noPrice = { ...f, maxPrice: null, minPrice: null };
    const c = await countMatches(sb, noPrice);
    if (c > 0) {
      alternatives.push({ label: `${c} imóve${c === 1 ? "l" : "is"} no ${f.condominium} sem limite de preço`, url: buildSearchUrl(noPrice), type: "search" });
      altOptions.push({ label: `Remover preço (${c})`, value: "rm_price", kind: "action", action: "set_max_price", payload: { maxPrice: null } });
    }
  }
  // 2) Try sibling condos in the same group (e.g. all Tamboré)
  if (f.condominium) {
    const groupHint = norm(f.condominium).split(" ")[0]; // "tambore"
    if (groupHint) {
      const breakdown = await getCondominiumBreakdown(sb, { ...f, condominium: null }, groupHint);
      const others = breakdown.filter((b) => b.condominium !== f.condominium).slice(0, 4);
      for (const o of others) {
        alternatives.push({ label: `${o.condominium} — ${o.count} imóve${o.count === 1 ? "l" : "is"}`, url: o.url!, type: "search" });
        altOptions.push({ label: o.condominium, value: o.condominium, kind: "condominium", action: "set_condominium", payload: { condominium: o.condominium } });
      }
    }
  }
  // 3) Try apartments if user asked for casa
  if (f.propertyType === "casa") {
    const apt = { ...f, propertyType: "apartamento" };
    const c = await countMatches(sb, apt);
    if (c > 0) {
      alternatives.push({ label: `${c} apartamento${c === 1 ? "" : "s"} com filtros parecidos`, url: buildSearchUrl(apt), type: "search" });
      altOptions.push({ label: `Considerar apartamentos (${c})`, value: "apartamento", kind: "propertyType", action: "set_property_type" });
    }
  }
  // 4) Try wider price
  if (f.maxPrice) {
    const wider = { ...f, maxPrice: Math.round(f.maxPrice * 1.5) };
    const c = await countMatches(sb, wider);
    if (c > 0) {
      altOptions.push({
        label: `Ampliar até ${formatPriceCompact(wider.maxPrice!)} (${c})`,
        value: String(wider.maxPrice),
        kind: "action",
        action: "broaden_price",
        payload: { maxPrice: wider.maxPrice },
      });
    }
  }

  const filterSummary = summarizeFilters(f) || "sem filtros";
  return {
    assistantMessage: alternatives.length
      ? `Não encontrei imóveis com **${filterSummary}** no momento. Algumas alternativas:`
      : `Não encontrei imóveis com **${filterSummary}** no momento. Quer ajustar algum filtro?`,
    responseType: "no_results_explanation" as const,
    parsedFilters: f,
    updatedState: state,
    matchCount: 0,
    links: alternatives,
    suggestedOptions: altOptions.length ? altOptions : [
      { label: "Ampliar preço", value: "broaden_price", kind: "action", action: "broaden_price" },
      { label: "Outros condomínios", value: "any_condo", kind: "action", action: "clear_condominium" },
      { label: "Considerar apartamentos", value: "apartamento", kind: "propertyType", action: "set_property_type" },
    ],
    clarificationType: "broaden",
    nextAction: "ask" as const,
  };
};

// =====================================================================
// Backward-compat: v1 wrapper
// =====================================================================
const handleConverse = async (sb: SB, body: any) => {
  return await handleConverseV2(sb, {
    ...body,
    currentState: { filters: body.currentFilters ?? { highlights: [] } },
  });
};

// =====================================================================
// Legacy text search
// =====================================================================
const legacySearch = async (sb: SB, query: string) => {
  const code = extractCode(query);
  const f: PropertySearchFilters = {};
  if (code) f.code = code;
  const price = parsePrice(query);
  if (price.minPrice) f.minPrice = price.minPrice;
  if (price.maxPrice) f.maxPrice = price.maxPrice;
  if (/\b(alug|loca)/i.test(query)) f.transactionType = "locacao";
  else if (/\b(vend|comprar)/i.test(query)) f.transactionType = "venda";

  const condoNum = findCondoNumber(query);
  if (condoNum) {
    const resolved = await resolveCondoByNumber(sb, condoNum.group, condoNum.number);
    if (resolved) f.condominium = resolved;
  }
  const results = await fetchTopMatches(sb, f, 24);
  return { results, parsed_filters: f };
};

// =====================================================================
// Handler
// =====================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (body?.action === "converse_v2") {
      const result = await handleConverseV2(supabase, body);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body?.action === "converse") {
      const result = await handleConverse(supabase, body);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body?.action === "search") {
      const filters: PropertySearchFilters = body.filters ?? {};
      const limit = Math.min(Math.max(Number(body.limit) || 24, 1), 60);
      const results = await fetchTopMatches(supabase, filters, limit);
      return new Response(JSON.stringify({ results, parsed_filters: filters }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const q = typeof body?.query === "string" ? body.query : "";
    const out = await legacySearch(supabase, q);
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-property-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
