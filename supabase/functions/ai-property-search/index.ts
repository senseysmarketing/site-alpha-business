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
  address?: string | null; // free-text region/street match (ex: "granja viana", "alameda araguaia")
  minBedrooms?: number | null;
  minBathrooms?: number | null;
  minParking?: number | null;
  minArea?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  maxCondoFee?: number | null;
  maxIptu?: number | null; // stored as annual amount
  highlights?: string[];
  // v3 additions: free-text keywords searched across all textual fields,
  // and property types the user wants to exclude ("tirar apartamentos").
  keywords?: string[];
  excludedPropertyTypes?: string[];
  lastDidYouMean?: { term: string; suggestion: string } | null;
  pendingClarification?: "alphaville" | "tambore" | null;
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

// ---- Numerais por extenso (pt-BR) -> dígitos ----
const NUM_UNIT: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9 };
const NUM_TEEN: Record<string, number> = { dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezasseis: 16, dezessete: 17, dezassete: 17, dezoito: 18, dezenove: 19, dezanove: 19 };
const NUM_TENS: Record<string, number> = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90 };
const NUM_HUND: Record<string, number> = { cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900 };
const NUM_SCALE_THOUSAND = new Set(["mil"]);
const NUM_SCALE_MILLION = new Set(["milhao", "milhoes"]);
const NUM_HALF = new Set(["meio", "meia"]);

const stripAccentsLower = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");

const isNumWord = (w: string): boolean =>
  w in NUM_UNIT || w in NUM_TEEN || w in NUM_TENS || w in NUM_HUND ||
  NUM_SCALE_THOUSAND.has(w) || NUM_SCALE_MILLION.has(w) || NUM_HALF.has(w);

const parseNumRun = (words: string[]): number => {
  let result = 0;
  let current = 0;
  for (const w of words) {
    if (w === "e") continue;
    if (w in NUM_UNIT) current += NUM_UNIT[w];
    else if (w in NUM_TEEN) current += NUM_TEEN[w];
    else if (w in NUM_TENS) current += NUM_TENS[w];
    else if (w in NUM_HUND) current += NUM_HUND[w];
    else if (NUM_HALF.has(w)) current += 0.5;
    else if (NUM_SCALE_THOUSAND.has(w)) {
      current = (current || 1) * 1000;
      result += current;
      current = 0;
    } else if (NUM_SCALE_MILLION.has(w)) {
      current = (current || 1) * 1000000;
      result += current;
      current = 0;
    }
  }
  return Math.round(result + current);
};

const numeralizePtBr = (text: string): string => {
  if (!text) return text;
  const tokens: { raw: string; start: number; end: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ raw: m[0], start: m.index, end: m.index + m[0].length });
  }
  const out: string[] = [];
  let lastEnd = 0;
  let i = 0;
  while (i < tokens.length) {
    const w = stripAccentsLower(tokens[i].raw);
    if (isNumWord(w)) {
      const runWords: string[] = [];
      let j = i;
      while (j < tokens.length) {
        const ww = stripAccentsLower(tokens[j].raw);
        if (isNumWord(ww)) {
          runWords.push(ww);
          j++;
        } else if (ww === "e" && j + 1 < tokens.length && isNumWord(stripAccentsLower(tokens[j + 1].raw))) {
          runWords.push("e");
          j++;
        } else break;
      }
      const value = parseNumRun(runWords);
      out.push(text.slice(lastEnd, tokens[i].start));
      out.push(String(value));
      lastEnd = tokens[j - 1].end;
      i = j;
    } else {
      i++;
    }
  }
  out.push(text.slice(lastEnd));
  return out.join("");
};

const fmtBRL = (n: number | null | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "Sob consulta";

// =====================================================================
// Consultive layer (handoff + show-results decision)
// =====================================================================
const WHATSAPP_NUMBER = "5511993116849";
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

const HANDOFF_TERMS = [
  "humano", "atendente", "atendimento", "corretor", "corretora",
  "consultor", "consultora", "especialista", "whatsapp", "wpp", "zap",
  "telefone", "ligacao", "ligar", "me chama", "me chame",
  "falar com alguem", "falar com uma pessoa", "falar com pessoa",
  "quero atendimento", "nao achei", "nao encontrei", "nao resolveu",
  "prefiro falar com alguem", "fala com humano", "atendimento humano",
];

const detectHandoffIntent = (message: string): boolean => {
  const n = norm(message);
  if (!n) return false;
  return HANDOFF_TERMS.some((t) => n.includes(t));
};

const SHOW_RESULTS_TERMS = [
  "me mostra", "me mostre", "mostra ai", "mostrar", "quero ver", "ver imove",
  "ver opcoes", "ver opcao", "ver resultado", "ver os resultado",
  "manda", "mande", "quais imove", "quais opcoes", "resultados", "opcoes",
  "me indique", "me indica", "recomenda", "recomende", "melhores",
  "mostra agora", "ver agora", "ver tudo", "ver todos",
];

const hasQualifiedSearchState = (f: PropertySearchFilters): boolean => {
  if (!f.transactionType) return false;
  return !!(f.condominium || f.condominiumGroup || f.propertyType || f.maxPrice || f.minPrice);
};

const shouldShowResultsV3 = (args: {
  message: string;
  patch: IntentPatch | null;
  selectedOption?: OptionChip;
  state: PropertySearchFilters;
  matchCount: number;
}): boolean => {
  const { message, patch, selectedOption, state, matchCount } = args;
  if (matchCount <= 0) return false;
  if (patch?.show_results === true) return true;
  if ((patch as any)?.intent === "show_results") return true;
  const opt = selectedOption;
  if (opt) {
    if (opt.action === "show_results") return true;
    if (opt.kind === "navigate") return true;
    if (opt.value === "show_all") return true;
  }
  const n = norm(message);
  if (n && SHOW_RESULTS_TERMS.some((t) => n.includes(t))) return true;
  if (matchCount === 1 && hasQualifiedSearchState(state)) return true;
  return false;
};

const buildWhatsAppUrl = (state: PropertySearchFilters, message: string): string => {
  const summary = summarizeFiltersV3(state);
  const last = (message ?? "").trim();
  const lines = [
    "Olá! Vim pela busca com IA do site AlphaBusiness.",
    summary ? `Estou procurando: ${summary}.` : "",
    last ? `Última mensagem: "${last.slice(0, 220)}"` : "",
  ].filter(Boolean);
  const text = lines.join("\n").slice(0, 600);
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
};

const buildHandoffResponse = (state: PropertySearchFilters, message: string) => {
  const url = buildWhatsAppUrl(state, message);
  return {
    assistantMessage:
      "Claro! Vou te conectar com um consultor da **AlphaBusiness** no WhatsApp. Ele segue com seu atendimento personalizado a partir daqui.",
    responseType: "handoff" as const,
    conversation_state: state,
    updatedState: { filters: state } as ConversationState,
    parsedFilters: state,
    links: [{ label: "Falar com consultor pelo WhatsApp", url, type: "whatsapp" as const }],
    suggestedOptions: [
      { label: "Ajustar filtros", value: "refine", kind: "action", action: "refine" },
      { label: "Nova busca", value: "reset", kind: "reset" },
    ] as OptionChip[],
    nextAction: "ask" as const,
  };
};

const filtersToQS = (f: PropertySearchFilters): string => {
  const p = new URLSearchParams();
  if (f.transactionType) p.set("transactionType", f.transactionType);
  if (f.propertyType) p.set("propertyType", f.propertyType);
  if (f.condominium) p.set("condominium", f.condominium);
  if (f.city) p.set("city", f.city);
  if (f.neighborhood) p.set("neighborhood", f.neighborhood);
  if (f.address) p.set("address", f.address);
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
  const q = numeralizePtBr(message).toLowerCase();
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
  const n = norm(numeralizePtBr(message));
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
  const n = norm(numeralizePtBr(message));
  const m = n.match(/(\d{1,2})\s*(suites?|quartos?|dormitorios?|dorms?)/);
  if (m) return parseInt(m[1], 10);
  return null;
};

const AREA_UNIT_RE = /(m2|m²|metros?\s*quadrados?|metros?)\b/i;
const parseArea = (message: string, opts?: { pending?: boolean }): number | null => {
  const n = norm(numeralizePtBr(message));
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
    if (f.transactionType === "locacao") query = query.in("transaction_type", ["locacao", "aluguel", "ambos"]);
    else query = query.in("transaction_type", ["venda", "ambos"]);
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
  if (f.address) query = query.ilike("address", `%${f.address}%`);
  if (f.minBedrooms) query = query.gte("bedrooms", f.minBedrooms);
  if (f.minBathrooms) query = query.gte("bathrooms", f.minBathrooms);
  if (f.minParking) query = query.gte("parking_spots", f.minParking);
  if (f.minArea) query = query.gte("area_total", f.minArea);
  // Choose the price column based on intent. For "ambos" rows, both columns are populated correctly.
  const priceCol = f.transactionType === "locacao" ? "rental_price" : "price";
  if (f.minPrice) query = query.gte(priceCol, f.minPrice);
  if (f.maxPrice) query = query.lte(priceCol, f.maxPrice);
  if (f.maxCondoFee) query = query.lte("condo_fee", f.maxCondoFee);
  if (f.maxIptu) query = query.lte("iptu", f.maxIptu);
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
      refineTurn: typeof raw.refineTurn === "number" ? raw.refineTurn : 0,
      pendingRefine: raw.pendingRefine ?? null,
      lastFiltersSig: typeof raw.lastFiltersSig === "string" ? raw.lastFiltersSig : undefined,
    };
  }
  return { filters: { highlights: [] } };
};

const filtersSignature = (f: PropertySearchFilters): string => {
  return JSON.stringify({
    t: f.transactionType ?? null,
    p: f.propertyType ?? null,
    c: f.condominium ?? null,
    cg: f.condominiumGroup ?? null,
    mb: f.minBedrooms ?? null,
    ma: f.minArea ?? null,
    mn: f.minPrice ?? null,
    mx: f.maxPrice ?? null,
    h: (f.highlights ?? []).slice().sort(),
  });
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
      if (n) {
        f.minBedrooms = n;
        if (state.pendingRefine === "bedrooms") state.pendingRefine = null;
      }
      break;
    }
    case "set_min_area": {
      const n = Number(opt.payload?.minArea ?? opt.value);
      if (Number.isFinite(n) && n > 0) {
        f.minArea = n;
        if (state.pendingRefine === "area") state.pendingRefine = null;
      }
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
// LLM interpretation layer (Lovable AI Gateway / Gemini)
// Roda como fallback quando o pipeline determinístico não pegou filtros.
// =====================================================================
interface LLMInterpretation {
  filters: Partial<PropertySearchFilters>;
  intent?: Intent;
  reply?: string;
}

const LLM_TIMEOUT_MS = 6000;

const interpretWithLLM = async (
  sb: SB,
  message: string,
  state: ConversationState,
  history: ConversationMessage[] | undefined,
): Promise<LLMInterpretation | null> => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  try {
    const condos = await fetchDistinctCondos(sb).catch(() => [] as { name: string }[]);
    const condoSample = condos.slice(0, 60).map((c) => c.name).join(", ");
    const recentHistory = (history ?? []).slice(-6)
      .map((m) => `${m.role === "user" ? "U" : "A"}: ${m.content}`)
      .join("\n");

    const system = `Você é um interpretador de mensagens para uma busca de imóveis de luxo em Alphaville/Tamboré. Sua única tarefa é traduzir a mensagem do usuário em um JSON com os filtros que ele quer aplicar. NUNCA invente filtros que o usuário não pediu.

Filtros disponíveis (todos opcionais):
- transactionType: "venda" | "locacao"
- propertyType: "casa" | "apartamento" | "cobertura" | "sobrado" | "terreno"
- condominium: string EXATA de uma das opções listadas
- condominiumGroup: "Tamboré" | "Alphaville" | "Residencial" (use quando o usuário cita o grupo sem número)
- minBedrooms: número
- minArea: número (em m²)
- minPrice: número (em R$)
- maxPrice: número (em R$)
- highlights: array com qualquer combinação de ["piscina","gourmet","jardim","vista","reformado","mobiliado"]

Intents válidas: new_search, update_filter, show_results, broaden_search, ask_condominium_breakdown, small_talk, greeting, handoff.

Condomínios reais no estoque (use o nome exato se reconhecer): ${condoSample}

Estado atual dos filtros: ${JSON.stringify(state.filters)}

Histórico recente:
${recentHistory || "(vazio)"}

Responda APENAS com JSON válido no formato:
{"filters": {...}, "intent": "...", "reply": "frase curta opcional em português"}`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
      }),
    });
    clearTimeout(t);
    if (!res.ok) {
      console.error("[interpretWithLLM] gateway status", res.status);
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    const out: LLMInterpretation = { filters: {} };
    const f = parsed.filters ?? {};
    if (f.transactionType === "venda" || f.transactionType === "locacao") out.filters.transactionType = f.transactionType;
    if (typeof f.propertyType === "string") out.filters.propertyType = f.propertyType;
    if (typeof f.condominium === "string") out.filters.condominium = f.condominium;
    if (typeof f.condominiumGroup === "string") out.filters.condominiumGroup = f.condominiumGroup;
    if (typeof f.minBedrooms === "number") out.filters.minBedrooms = f.minBedrooms;
    if (typeof f.minArea === "number") out.filters.minArea = f.minArea;
    if (typeof f.minPrice === "number") out.filters.minPrice = f.minPrice;
    if (typeof f.maxPrice === "number") out.filters.maxPrice = f.maxPrice;
    if (Array.isArray(f.highlights)) out.filters.highlights = f.highlights.filter((x: unknown) => typeof x === "string");
    if (typeof parsed.intent === "string") out.intent = parsed.intent as Intent;
    if (typeof parsed.reply === "string") out.reply = parsed.reply.trim().slice(0, 240);
    return out;
  } catch (e) {
    console.error("[interpretWithLLM] error", e);
    return null;
  }
};

// =====================================================================
// Conversation handler v2
// =====================================================================

const handleConverseV2 = async (sb: SB, body: any) => {
  const message = numeralizePtBr(String(body.message ?? "").trim());
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
  const sig = filtersSignature(state.filters);
  const filtersUnchanged = state.lastFiltersSig === sig;
  state.lastFiltersSig = sig;
  const llmReply: string | undefined = (body as any)._llmReplyHint;

  let assistantMessage: string;
  if (llmReply) {
    assistantMessage = llmReply;
  } else if (filtersUnchanged) {
    // Não mudou nada — não repetir o resumo, ir direto pro próximo passo
    assistantMessage = matchCount > 0
      ? `Posso abrir os ${countTxt} ou prefere afinar mais algum critério (condomínio, metragem, suítes)?`
      : `Ainda sem matches. Quer relaxar algum filtro?`;
  } else {
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
    assistantMessage = variants[(state.refineTurn ?? 0) % variants.length];
    state.refineTurn = (state.refineTurn ?? 0) + 1;
  }

  return {
    assistantMessage,
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
  // Decide which price to highlight using the user's stated intent. For "ambos"
  // rows, the column matching the intent is the relevant one. Default to sale price.
  const intent = state.filters?.transactionType;
  const wantsRental = intent === "locacao";
  const price = wantsRental ? prop.rental_price : prop.price;
  const priceText = price ? `${fmtBRL(price)}${wantsRental ? "/mês" : ""}` : "Sob consulta";

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
// =====================================================================
// V3 — Conversational Agent (in-memory full scan, fuzzy condo, LLM intent)
// =====================================================================
// =====================================================================

const ROMAN_MAP: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
};
const replaceRomans = (s: string): string =>
  s.replace(/\b(i{1,3}|iv|vi{0,3}|ix|x)\b/gi, (m) => {
    const n = ROMAN_MAP[m.toLowerCase()];
    return n ? String(n) : m;
  });

interface PropRow {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  property_type: string | null;
  transaction_type: string;
  condominium: string | null;
  condominium_normalized: string | null;
  neighborhood: string | null;
  city: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  area_total: number | null;
  area_built: number | null;
  price: number | null;
  rental_price: number | null;
  condo_fee: number | null;
  iptu: number | null;
  is_featured: boolean | null;
  engineering_highlights: string[] | null;
  photos: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  searchable: string;
  titleN: string;
  descriptionN: string;
  highlightsN: string;
}

const V3_TTL_MS = 5 * 60 * 1000;
let propsCacheV3: { rows: PropRow[]; at: number } | null = null;

const loadActiveProperties = async (sb: SB): Promise<PropRow[]> => {
  if (propsCacheV3 && Date.now() - propsCacheV3.at < V3_TTL_MS) return propsCacheV3.rows;
  const all: any[] = [];
  for (let from = 0; from < 10000; from += 1000) {
    const { data, error } = await sb
      .from("properties")
      .select(
        "id, code, title, description, property_type, transaction_type, condominium, condominium_normalized, neighborhood, city, address, bedrooms, bathrooms, parking_spots, area_total, area_built, price, rental_price, condo_fee, iptu, is_featured, engineering_highlights, photos, created_at, updated_at",
      )
      .eq("status", "ativo")
      .range(from, from + 999);
    if (error) {
      console.error("[loadActiveProperties] error", error);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  const rows: PropRow[] = all.map((p) => {
    const hl = (p.engineering_highlights ?? []) as string[];
    const titleN = norm(p.title);
    const descriptionN = norm(p.description);
    const highlightsN = norm(hl.join(" "));
    const searchable = norm(
      [
        p.title,
        p.description,
        p.property_type,
        p.transaction_type,
        p.condominium,
        p.neighborhood,
        p.city,
        p.address,
        ...hl,
      ]
        .filter(Boolean)
        .join(" "),
    );
    return { ...p, searchable, titleN, descriptionN, highlightsN };
  });
  propsCacheV3 = { rows, at: Date.now() };
  console.log(`[loadActiveProperties] loaded ${rows.length} active properties`);
  return rows;
};

interface CondoEntry {
  canonical: string;
  normalized: string;
  aliases: string[];
}

let condoIndexCacheV3: { entries: CondoEntry[]; at: number } | null = null;

const loadCondoIndex = async (sb: SB): Promise<CondoEntry[]> => {
  if (condoIndexCacheV3 && Date.now() - condoIndexCacheV3.at < V3_TTL_MS) return condoIndexCacheV3.entries;
  const rows = await loadActiveProperties(sb);
  const map = new Map<string, CondoEntry>();
  for (const r of rows) {
    if (!r.condominium) continue;
    const n = r.condominium_normalized || norm(r.condominium);
    if (!map.has(n)) map.set(n, { canonical: r.condominium, normalized: n, aliases: [] });
  }
  const { data: condos } = await sb
    .from("condominiums")
    .select("name, is_active")
    .eq("is_active", true);
  for (const c of (condos ?? []) as { name: string }[]) {
    const n = norm(c.name);
    if (!map.has(n)) map.set(n, { canonical: c.name, normalized: n, aliases: [] });
  }
  const { data: aliases } = await sb
    .from("condominium_aliases")
    .select("alias_normalized, canonical_normalized");
  for (const a of (aliases ?? []) as { alias_normalized: string; canonical_normalized: string }[]) {
    const entry = map.get(a.canonical_normalized);
    if (entry) entry.aliases.push(a.alias_normalized);
  }
  const entries = Array.from(map.values());
  condoIndexCacheV3 = { entries, at: Date.now() };
  console.log(`[loadCondoIndex] ${entries.length} condos indexed`);
  return entries;
};

const STOPWORDS_V3 = new Set([
  "de", "do", "da", "dos", "das", "e", "ed", "edificio", "edifício",
  "residencial", "condominio", "condomínio", "cond", "resid", "res",
  "the", "of", "no", "na", "em", "ao", "a", "o", "um", "uma",
]);
const tokensOf = (s: string): string[] => s.split(/\s+/).filter(Boolean);
const meaningfulTokens = (s: string): string[] =>
  tokensOf(s).filter((t) => !STOPWORDS_V3.has(t) && (t.length > 1 || /^\d+$/.test(t)));

const scoreCondoMatch = (queryN: string, entry: CondoEntry): number => {
  if (!queryN) return 0;
  if (queryN === entry.normalized) return 1.0;
  if (entry.aliases.includes(queryN)) return 0.95;
  const qToks = meaningfulTokens(queryN);
  if (qToks.length === 0) return 0;
  const cToks = new Set(meaningfulTokens(entry.normalized));
  let inter = 0;
  for (const t of qToks) if (cToks.has(t)) inter++;
  const coverage = inter / qToks.length;
  if (coverage < 0.5) return 0;
  let score = coverage === 1 ? 0.92 : coverage * 0.78;
  const sizeRatio = Math.min(qToks.length, cToks.size) / Math.max(qToks.length, cToks.size || 1);
  score *= 0.7 + 0.3 * sizeRatio;
  return score;
};

interface CondoResolution {
  entry: CondoEntry;
  score: number;
  confidence: "high" | "medium" | "low";
}
const resolveCondominium = (query: string, entries: CondoEntry[]): CondoResolution | null => {
  const qn = norm(replaceRomans(query));
  let best: { entry: CondoEntry; score: number } | null = null;
  for (const e of entries) {
    const s = scoreCondoMatch(qn, e);
    if (s > 0 && (!best || s > best.score)) best = { entry: e, score: s };
  }
  if (!best) return null;
  const confidence: "high" | "medium" | "low" =
    best.score >= 0.9 ? "high" : best.score >= 0.65 ? "medium" : "low";
  return { ...best, confidence };
};

// ----- Keyword expansion (real-estate vocabulary) -----
const KEYWORD_SYNONYMS_V3: Record<string, string[]> = {
  "piscina": ["piscina"],
  "neo classica": ["neo classica", "neoclassica", "neo classico", "neoclassico"],
  "neoclassica": ["neo classica", "neoclassica", "neo classico", "neoclassico"],
  "moderna": ["moderna", "moderno", "contemporanea", "contemporaneo"],
  "contemporanea": ["contemporanea", "contemporaneo", "moderna", "moderno"],
  "area gourmet": ["area gourmet", "gourmet", "churrasqueira"],
  "gourmet": ["gourmet", "churrasqueira", "area gourmet"],
  "churrasqueira": ["churrasqueira", "gourmet"],
  "mobiliada": ["mobiliada", "mobiliado"],
  "mobiliado": ["mobiliado", "mobiliada"],
  "vista": ["vista panoramica", "vista"],
  "alto padrao": ["alto padrao", "luxo", "premium"],
  "sobrado": ["sobrado", "sobradinho"],
  "varanda": ["varanda", "sacada", "terraço", "terraco"],
  "planejados": ["planejados", "moveis planejados"],
  "jardim": ["jardim", "quintal"],
  "reformado": ["reformado", "reformada", "novo", "nova"],
  "cobertura": ["cobertura"],
};

const expandKeyword = (kw: string): string[] => {
  const n = norm(kw);
  const direct = KEYWORD_SYNONYMS_V3[n];
  if (direct) return direct.map(norm);
  // simple plural fallback
  const variants = [n];
  if (n.endsWith("s")) variants.push(n.slice(0, -1));
  else variants.push(n + "s");
  return variants;
};

// ----- Filtering + scoring -----
interface ScoredMatch {
  row: PropRow;
  score: number;
}

const filterAndRankV3 = (rows: PropRow[], f: PropertySearchFilters): ScoredMatch[] => {
  const out: ScoredMatch[] = [];
  const condoTargetNorm = f.condominium ? norm(f.condominium) : null;
  const groupTargetNorm = f.condominiumGroup ? norm(f.condominiumGroup) : null;
  const excluded = (f.excludedPropertyTypes ?? []).map(norm);
  const keywords = (f.keywords ?? []).map(norm);
  const highlights = (f.highlights ?? []).map(norm);

  for (const r of rows) {
    let score = 0;

    // transaction
    if (f.transactionType) {
      const ok =
        f.transactionType === "locacao"
          ? r.transaction_type === "locacao" || r.transaction_type === "aluguel" || r.transaction_type === "ambos"
          : r.transaction_type === "venda" || r.transaction_type === "ambos";
      if (!ok) continue;
    }

    // property_type include
    if (f.propertyType) {
      const pt = norm(r.property_type ?? "");
      if (!pt.includes(norm(f.propertyType))) continue;
    }
    // excluded property types
    if (excluded.length) {
      const pt = norm(r.property_type ?? "");
      if (excluded.some((x) => pt.includes(x))) continue;
    }
    // condominium (hard)
    if (condoTargetNorm) {
      const cn = r.condominium_normalized ?? norm(r.condominium ?? "");
      if (cn === condoTargetNorm) score += 100;
      else continue;
    } else if (groupTargetNorm) {
      const cn = r.condominium_normalized ?? norm(r.condominium ?? "");
      if (!cn.includes(groupTargetNorm)) continue;
      score += 30;
    }
    if (f.neighborhood && !norm(r.neighborhood ?? "").includes(norm(f.neighborhood))) continue;
    if (f.city && !norm(r.city ?? "").includes(norm(f.city))) continue;
    if (f.address && !r.searchable.includes(norm(f.address))) continue;
    if (f.minBedrooms && (r.bedrooms ?? 0) < f.minBedrooms) continue;
    if (f.minBathrooms && (r.bathrooms ?? 0) < f.minBathrooms) continue;
    if (f.minParking && (r.parking_spots ?? 0) < f.minParking) continue;
    if (f.minArea && (r.area_total ?? 0) < f.minArea) continue;
    const priceCol = f.transactionType === "locacao" ? r.rental_price : r.price;
    if (f.minPrice && (priceCol ?? 0) < f.minPrice) continue;
    if (f.maxPrice && priceCol != null && priceCol > f.maxPrice) continue;
    if (f.maxCondoFee && r.condo_fee != null && r.condo_fee > f.maxCondoFee) continue;
    if (f.maxIptu && r.iptu != null && r.iptu > f.maxIptu) continue;

    // keywords (AND across, with variant OR per keyword)
    let allKw = true;
    for (const kw of keywords) {
      const variants = expandKeyword(kw);
      const hit = variants.some((v) => r.searchable.includes(v));
      if (!hit) { allKw = false; break; }
      // score by where it matches
      const main = variants[0];
      if (r.titleN.includes(main)) score += 40;
      else if (r.descriptionN.includes(main)) score += 25;
      else if (r.highlightsN.includes(main)) score += 20;
      else score += 10;
    }
    if (!allKw) continue;

    // legacy highlights as soft bonus only
    if (highlights.length) {
      for (const h of highlights) {
        const variants = expandKeyword(h);
        if (variants.some((v) => r.searchable.includes(v))) score += 8;
      }
    }

    if (r.is_featured) score += 5;
    const ref = r.updated_at ?? r.created_at;
    if (ref) {
      const days = (Date.now() - new Date(ref).getTime()) / 86_400_000;
      if (days < 7) score += 3;
      else if (days < 30) score += 1;
    }

    out.push({ row: r, score });
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.row.is_featured ? 1 : 0) !== (a.row.is_featured ? 1 : 0))
      return (b.row.is_featured ? 1 : 0) - (a.row.is_featured ? 1 : 0);
    const ar = new Date(a.row.updated_at ?? a.row.created_at ?? 0).getTime();
    const br = new Date(b.row.updated_at ?? b.row.created_at ?? 0).getTime();
    return br - ar;
  });
  return out;
};

const rowToResult = (r: PropRow): PropertyResult => ({
  id: r.id,
  code: r.code,
  title: r.title ?? "",
  condominium: r.condominium,
  neighborhood: r.neighborhood,
  city: r.city,
  price: r.price,
  rental_price: r.rental_price,
  transaction_type: r.transaction_type,
  bedrooms: r.bedrooms,
  bathrooms: r.bathrooms,
  parking_spots: r.parking_spots,
  area_total: r.area_total,
  photo: (r.photos && r.photos[0]) || null,
  relevance_reason: r.condominium ?? r.neighborhood ?? "Compatível com sua busca",
});

// ----- LLM intent extractor -----
interface IntentPatch {
  filters_patch?: Partial<PropertySearchFilters>;
  condominium_query?: string | null;
  address_query?: string | null;
  keywords_add?: string[];
  keywords_remove?: string[];
  excluded_add?: string[];
  excluded_remove?: string[];
  reset?: boolean;
  show_results?: boolean;
  reply?: string;
  intent?: string;
}

const extractSearchIntentV3 = async (
  sb: SB,
  message: string,
  state: PropertySearchFilters,
  history: ConversationMessage[] | undefined,
): Promise<IntentPatch | null> => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  try {
    const entries = await loadCondoIndex(sb);
    const condoSample = entries.slice(0, 80).map((e) => e.canonical).join(", ");
    const recent = (history ?? [])
      .slice(-6)
      .map((m) => `${m.role === "user" ? "U" : "A"}: ${m.content}`)
      .join("\n");

    const system = `Você é o **Rafa IA**, consultor digital imobiliário da **AlphaBusiness**, especialista em imóveis de alto padrão na região metropolitana de São Paulo — com forte atuação em Alphaville, Tamboré, Granja Viana, Cotia, Barueri e Santana de Parnaíba. NÃO recuse buscas em outras regiões: se o usuário mencionar um bairro/rua/cidade que aparece nos imóveis cadastrados, busque normalmente usando o campo address/neighborhood/city. Sua função é INTERPRETAR a mensagem do usuário, conduzir a conversa de forma consultiva e devolver um PATCH JSON que atualiza os filtros da busca. Você NÃO inventa imóveis, valores, disponibilidade ou características — apenas interpreta intenção.

Postura consultiva:
- Aja como consultor humano: entenda o perfil antes de mostrar opções.
- NÃO marque show_results=true apenas porque há filtros ou resultados encontrados.
- Quando o usuário só adiciona/refina filtros, marque intent="update_filter" e responda com pergunta útil ou confirmação curta — sem forçar exibição.
- Marque show_results=true APENAS se o usuário pedir explicitamente para ver/mostrar/recomendar imóveis, opções, resultados, cards ou destaques ("me mostra", "quero ver", "manda opções", "ver resultados", "quais imóveis tem", "me indique os melhores").
- Se o usuário pedir humano/corretor/consultor/atendimento/WhatsApp ou demonstrar frustração ("não achei", "não resolveu"), marque intent="handoff".
- Termos como piscina, neo clássica, área gourmet, vista, mobiliado, varanda, sacada, terraço, alto padrão, luxo → keywords_add (busca textual).

Filtros disponíveis (todos opcionais, números puros sem unidade):
- transactionType: "venda" | "locacao"
- propertyType: "casa" | "apartamento" | "cobertura" | "sobrado" | "terreno"
- condominium (string EXATA da lista, se reconhecer; caso contrário use condominium_query)
- neighborhood: bairro/sub-região no cadastro (ex.: "Alphaville 1", "Tamboré 2", "Burle Marx")
- city: cidade (ex.: "Barueri", "Santana de Parnaíba")
- minBedrooms, minBathrooms, minParking, minArea, minPrice, maxPrice
- maxCondoFee: limite máximo do valor MENSAL de condomínio em R$ (ex.: "condomínio até 2 mil" → 2000)
- maxIptu: limite máximo do IPTU em R$ ANUAL (se o usuário falar "iptu até X por mês", multiplique X por 12 antes de enviar)

Campos extras:
- condominium_query: nome solto do condomínio quando você não tem certeza da grafia — eu mesmo resolvo via fuzzy match
- address_query: trecho de rua/região/macro-bairro que NÃO é um condomínio fechado nem aparece na lista de neighborhoods (ex.: "granja viana", "raposo tavares", "alameda araguaia", "km 26", "cotia"). É um ilike no endereço completo.
- keywords_add: palavras-chave textuais a adicionar ao filtro (ex: "piscina", "neo classica", "vista", "varanda", "gourmet")
- keywords_remove: palavras-chave a remover ("tirar piscina")
- excluded_add: tipos a excluir ("tirar apartamentos" → ["apartamento"])
- excluded_remove: tipos a deixar de excluir
- reset: true se o usuário pediu limpar/recomeçar/nova busca
- show_results: true se o usuário pediu para ver/mostrar agora
- reply: frase curta natural em português (opcional, máx 200 chars)

Regras críticas:
1. NUNCA invente filtros que o usuário não pediu NESTA mensagem. Não repita filtros já presentes no estado atual — devolva APENAS o delta.
2. NUNCA adicione minBedrooms, minBathrooms, minParking, minArea, minPrice, maxPrice, maxCondoFee, maxIptu ou transactionType se o usuário não citou número, valor, "compra/vender" ou "alugar/locação" NESTA mensagem.
3. Se o usuário citar um condomínio que não está na lista, devolva em condominium_query (NÃO em condominium).
4. Valores monetários sempre em reais inteiros (3 milhões → 3000000).
5. "casa neo clássica" → filters_patch.propertyType="casa" + keywords_add=["neo classica"].
6. "tirar piscina" → keywords_remove=["piscina"]. "limpar" → reset=true.
7. **DESAMBIGUAÇÃO BAIRRO vs CONDOMÍNIO**: Os termos "Alphaville" e "Tamboré" SOZINHOS (sem número e sem outro condomínio citado) são AMBÍGUOS: podem significar a região como um todo OU um condomínio numerado específico. NESTE CASO, devolva APENAS o reply pedindo a clarificação ("Você quer ver imóveis da região de Alphaville como um todo ou de um condomínio específico, ex.: Alphaville 1, 2, 3…?"), com filters_patch vazio, e intent="clarify_region". NÃO tente adivinhar.
8. Com número ("alphaville 1", "tamboré 2") use condominium normalmente.
9. "granja viana", "raposo tavares", "km 26", "cotia" → use address_query (NÃO condominium).
10. **VENDA vs LOCAÇÃO**: Se o usuário citar valor/orçamento ("até 1 milhão", "uns 8 mil"), mas ainda NÃO disse se quer comprar ou alugar, NÃO chute transactionType — devolva filters_patch só com o preço e uma reply curta perguntando "Você quer comprar ou alugar?". Faixas típicas de aluguel ficam em R$ até 50 mil/mês; valores acima costumam ser venda — mas confirme.
11. Imóveis com transaction_type="ambos" estão disponíveis tanto para venda quanto para locação (mostre preço correto conforme a intenção do cliente).

Exemplos:
- Mensagem "casa no alphaville 1" → { filters_patch: { propertyType: "casa", condominium: "Alphaville 1" } }.
- Mensagem "alphaville 1" (sem mais nada) → { filters_patch: { condominium: "Alphaville 1" } }.
- Mensagem "imóveis em alphaville" → { filters_patch: {}, intent: "clarify_region", reply: "Quer ver toda a região de Alphaville ou um condomínio específico (Alphaville 1, 2, 3…)?" }.
- Mensagem "quero imoveis na granja viana" → { filters_patch: {}, address_query: "granja viana", reply: "Achei imóveis na Granja Viana. Você quer comprar ou alugar?" }.
- Mensagem "até 5 milhões" → { filters_patch: { maxPrice: 5000000 }, reply: "Show, anotei até R$ 5 milhões. Você está pensando em comprar ou alugar?" }.
- Mensagem "uns 15 mil de aluguel" → { filters_patch: { transactionType: "locacao", maxPrice: 15000 } }.




Lista real de condomínios ativos: ${condoSample}

Estado atual: ${JSON.stringify(state)}

Histórico:
${recent || "(vazio)"}

Responda APENAS JSON válido no schema descrito acima.`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
      }),
    });
    clearTimeout(t);
    if (!res.ok) {
      console.error("[extractSearchIntentV3] gateway", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const raw = JSON.parse(content);
    // Tolerate both shapes: { filters_patch: {...}, ... } and a flat object with
    // filter fields at the root (Gemini frequently flattens it). Move any
    // unknown-but-known filter keys into filters_patch.
    const FILTER_KEYS = [
      "transactionType","propertyType","condominium","condominiumGroup",
      "neighborhood","city","address","minBedrooms","minBathrooms","minParking",
      "minArea","minPrice","maxPrice","maxCondoFee","maxIptu",
    ];
    const patch: IntentPatch = {
      filters_patch: { ...(raw.filters_patch ?? {}) },
      condominium_query: raw.condominium_query ?? null,
      address_query: typeof raw.address_query === "string" ? raw.address_query : null,
      keywords_add: Array.isArray(raw.keywords_add) ? raw.keywords_add : [],
      keywords_remove: Array.isArray(raw.keywords_remove) ? raw.keywords_remove : [],
      excluded_add: Array.isArray(raw.excluded_add) ? raw.excluded_add : [],
      excluded_remove: Array.isArray(raw.excluded_remove) ? raw.excluded_remove : [],
      reset: raw.reset === true,
      show_results: raw.show_results === true,
      reply: typeof raw.reply === "string" ? raw.reply : undefined,
      intent: typeof raw.intent === "string" ? raw.intent : undefined,
    };
    for (const k of FILTER_KEYS) {
      if (raw[k] !== undefined && (patch.filters_patch as any)[k] === undefined) {
        (patch.filters_patch as any)[k] = raw[k];
      }
    }
    // Some models nest under `filters` instead of `filters_patch`
    if (raw.filters && typeof raw.filters === "object") {
      for (const k of FILTER_KEYS) {
        if ((raw.filters as any)[k] !== undefined && (patch.filters_patch as any)[k] === undefined) {
          (patch.filters_patch as any)[k] = (raw.filters as any)[k];
        }
      }
    }
    console.log("[extractSearchIntentV3] message=", message, "raw=", JSON.stringify(raw), "patch=", JSON.stringify(patch));
    return patch;
  } catch (e) {
    console.error("[extractSearchIntentV3] error", e);
    return null;
  }
};

const blankFiltersV3 = (): PropertySearchFilters => ({
  highlights: [],
  keywords: [],
  excludedPropertyTypes: [],
  lastDidYouMean: null,
  pendingClarification: null,
});

const sanitizeFiltersV3 = (raw: any): PropertySearchFilters => {
  const base = blankFiltersV3();
  if (!raw || typeof raw !== "object") return base;
  const f: PropertySearchFilters = { ...base, ...raw };
  f.highlights = Array.isArray(f.highlights) ? f.highlights : [];
  f.keywords = Array.isArray(f.keywords) ? f.keywords : [];
  f.excludedPropertyTypes = Array.isArray(f.excludedPropertyTypes) ? f.excludedPropertyTypes : [];
  if (f.pendingClarification !== "alphaville" && f.pendingClarification !== "tambore") {
    f.pendingClarification = null;
  }
  return f;
};

const applyPatchV3 = (
  state: PropertySearchFilters,
  patch: IntentPatch,
  entries: CondoEntry[],
): PropertySearchFilters => {
  if (patch.reset) return blankFiltersV3();
  const next: PropertySearchFilters = {
    ...state,
    highlights: [...(state.highlights ?? [])],
    keywords: [...(state.keywords ?? [])],
    excludedPropertyTypes: [...(state.excludedPropertyTypes ?? [])],
    lastDidYouMean: null,
  };
  const fp = patch.filters_patch ?? {};
  const directKeys: (keyof PropertySearchFilters)[] = [
    "transactionType", "propertyType", "neighborhood", "city", "address",
    "minBedrooms", "minBathrooms", "minParking", "minArea", "minPrice", "maxPrice",
    "maxCondoFee", "maxIptu",
  ];
  for (const k of directKeys) {
    if (k in fp) {
      const v = (fp as any)[k];
      if (v === null) (next as any)[k] = null;
      else if (v !== undefined) (next as any)[k] = v;
    }
  }
  // address_query (free-text region/street) — only set if not already provided in filters_patch
  if (patch.address_query && next.address == null) {
    next.address = patch.address_query.trim();
  }

  // Condominium resolution
  const condoText = (typeof fp.condominium === "string" && fp.condominium) || patch.condominium_query;
  if (fp.condominium === null) {
    next.condominium = null;
    next.condominiumGroup = null;
  } else if (condoText) {
    const resolved = resolveCondominium(condoText, entries);
    if (resolved && resolved.confidence === "high") {
      next.condominium = resolved.entry.canonical;
      next.condominiumGroup = null;
    } else if (resolved && resolved.confidence === "medium") {
      next.lastDidYouMean = { term: condoText, suggestion: resolved.entry.canonical };
    } else {
      next.lastDidYouMean = { term: condoText, suggestion: "" };
    }
  }

  // Keywords
  for (const kw of patch.keywords_add ?? []) {
    const n = norm(kw);
    if (n && !next.keywords!.includes(n)) next.keywords!.push(n);
  }
  for (const kw of patch.keywords_remove ?? []) {
    const n = norm(kw);
    next.keywords = next.keywords!.filter((x) => x !== n);
  }
  for (const e of patch.excluded_add ?? []) {
    const n = norm(e);
    if (n && !next.excludedPropertyTypes!.includes(n)) next.excludedPropertyTypes!.push(n);
  }
  for (const e of patch.excluded_remove ?? []) {
    const n = norm(e);
    next.excludedPropertyTypes = next.excludedPropertyTypes!.filter((x) => x !== n);
  }

  return next;
};

const summarizeFiltersV3 = (f: PropertySearchFilters): string => {
  const parts: string[] = [];
  if (f.transactionType) parts.push(f.transactionType === "venda" ? "compra" : "locação");
  if (f.propertyType) parts.push(f.propertyType);
  if (f.condominium) parts.push(`no ${f.condominium}`);
  else if (f.condominiumGroup) parts.push(`em ${f.condominiumGroup}`);
  if (f.neighborhood) parts.push(`bairro ${f.neighborhood}`);
  if (f.city) parts.push(`em ${f.city}`);
  if (f.address) parts.push(`região ${f.address}`);
  if (f.minBedrooms) parts.push(`${f.minBedrooms}+ suítes`);
  if (f.minArea) parts.push(`a partir de ${f.minArea}m²`);
  if (f.maxPrice) parts.push(`até ${fmtBRL(f.maxPrice)}`);
  if (f.minPrice) parts.push(`acima de ${fmtBRL(f.minPrice)}`);
  if (f.keywords && f.keywords.length) parts.push(`destaque para ${f.keywords.join(", ")}`);
  if (f.excludedPropertyTypes && f.excludedPropertyTypes.length)
    parts.push(`sem ${f.excludedPropertyTypes.join("/")}`);
  return parts.join(", ");
};

const buildDynamicSuggestionsV3 = (
  f: PropertySearchFilters,
  matchCount: number,
  matches: ScoredMatch[],
): OptionChip[] => {
  const chips: OptionChip[] = [];
  if (matchCount > 0) {
    chips.push({
      label: matchCount === 1 ? "Ver imóvel" : `Ver os ${Math.min(matchCount, 50)} resultados`,
      value: "show_all",
      kind: "navigate",
      url: buildSearchUrl(f),
    });
  }
  if (matchCount > 8) {
    if (!f.condominium && !f.condominiumGroup) {
      const condos = new Map<string, number>();
      for (const m of matches.slice(0, 80)) {
        if (m.row.condominium) condos.set(m.row.condominium, (condos.get(m.row.condominium) ?? 0) + 1);
      }
      const top = Array.from(condos.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
      for (const [name, count] of top) {
        chips.push({
          label: `${name} (${count})`,
          value: name,
          kind: "condominium",
          action: "set_condominium",
          payload: { condominium: name },
        });
      }
    }
    if (!f.minBedrooms) {
      chips.push({ label: "4+ suítes", value: "4", kind: "action", action: "set_bedrooms" });
    }
  }
  if (matchCount === 0) {
    if (f.maxPrice) {
      const wider = Math.round(f.maxPrice * 1.5);
      chips.push({
        label: `Ampliar até ${fmtBRL(wider)}`,
        value: String(wider),
        kind: "action",
        action: "broaden_price",
        payload: { maxPrice: wider },
      });
    }
    if (f.condominium) {
      chips.push({ label: "Qualquer condomínio", value: "any", kind: "action", action: "clear_condominium" });
    }
  }
  chips.push({ label: "Nova busca", value: "reset", kind: "reset" });
  return chips;
};

// Chip → filter patch (selected by user from previous chips)
const applySelectedChipV3 = (
  state: PropertySearchFilters,
  opt: OptionChip | undefined,
): PropertySearchFilters => {
  if (!opt) return state;
  const f: PropertySearchFilters = {
    ...state,
    highlights: [...(state.highlights ?? [])],
    keywords: [...(state.keywords ?? [])],
    excludedPropertyTypes: [...(state.excludedPropertyTypes ?? [])],
  };
  switch (opt.action ?? opt.kind) {
    case "set_condominium":
    case "condominium": {
      const c = (opt.payload?.condominium as string) ?? opt.value;
      if (c) { f.condominium = c; f.condominiumGroup = null; f.lastDidYouMean = null; f.pendingClarification = null; }
      break;
    }
    case "set_condominium_group":
    case "condominium_group": {
      const g = (opt.payload?.condominiumGroup as string) ?? opt.value;
      if (g) { f.condominiumGroup = g; f.condominium = null; f.lastDidYouMean = null; f.pendingClarification = null; }
      break;
    }
    case "any_condo":
    case "clear_condominium":
      f.condominium = null; f.condominiumGroup = null; f.pendingClarification = null; break;
    case "set_transaction":
    case "transaction":
      if (opt.value === "venda" || opt.value === "locacao") f.transactionType = opt.value;
      break;
    case "set_property_type":
    case "propertyType":
      if (opt.value) f.propertyType = opt.value;
      break;
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
    case "set_max_price":
    case "broaden_price": {
      const n = Number(opt.payload?.maxPrice ?? opt.value);
      if (Number.isFinite(n) && n > 0) f.maxPrice = n;
      else if (typeof f.maxPrice === "number") f.maxPrice = Math.round(f.maxPrice * 1.5);
      break;
    }
    case "highlight": {
      const tags = String(opt.value).split(",").map((s) => s.trim()).filter(Boolean);
      const kw = [...(f.keywords ?? [])];
      for (const t of tags) { const n = norm(t); if (n && !kw.includes(n)) kw.push(n); }
      f.keywords = kw;
      break;
    }
  }
  return f;
};

// ----- Macro-region detection (pre-LLM) -----
// Regiões/macro-bairros que NÃO são condomínios fechados mas aparecem
// no campo `address` dos imóveis. Casamos via normalização antes do LLM.
const REGION_TERMS: { match: string; kind: "address" | "city"; value: string; label: string }[] = [
  { match: "granja viana", kind: "address", value: "granja viana", label: "Granja Viana" },
  { match: "raposo tavares", kind: "address", value: "raposo tavares", label: "Raposo Tavares" },
  { match: "km 26", kind: "address", value: "km 26", label: "Km 26 (Raposo Tavares)" },
  { match: "cotia", kind: "address", value: "cotia", label: "Cotia" },
  { match: "santana de parnaiba", kind: "city", value: "Santana de Parnaíba", label: "Santana de Parnaíba" },
  { match: "barueri", kind: "city", value: "Barueri", label: "Barueri" },
];

const detectRegion = (message: string) => {
  const n = norm(message);
  if (!n) return null;
  for (const r of REGION_TERMS) {
    if (n.includes(r.match)) return r;
  }
  return null;
};

// Detecta menção AMBÍGUA a "alphaville" ou "tambore" sozinhos (sem número e
// sem outra palavra que identifique um condomínio específico).
const detectAmbiguousArea = (message: string): "alphaville" | "tambore" | null => {
  const n = norm(message);
  if (!n) return null;
  const hasNumber = /\b\d{1,2}\b/.test(n);
  if (hasNumber) return null;
  // Se também citou outro condomínio específico (ex.: "burle marx"), não é ambíguo.
  if (/(burle marx|genesis|villa solaia|melville|valville|alpha conde|alpha sitio|18 do forte|campos do conde|gramercy|myra|oiapoque|splendore|canvas|atria|essencia|parati|mont blanc|jardins tambore|oka mamore|alpha vita|ereditá|eredita|itahye|itahyê)/.test(n)) return null;
  if (/\balphaville\b/.test(n)) return "alphaville";
  if (/\btambore\b/.test(n)) return "tambore";
  return null;
};

const handleConverseV3 = async (sb: SB, body: any) => {
  const message = numeralizePtBr(String(body.message ?? "").trim());
  const incoming = body.conversation_state ?? body.currentState?.filters ?? body.currentState ?? {};
  let state = sanitizeFiltersV3(incoming);
  const selectedOption = body.selectedOption as OptionChip | undefined;
  state = applySelectedChipV3(state, selectedOption);
  const history = body.history as ConversationMessage[] | undefined;

  // 0) Deterministic handoff — before any search
  if (message && detectHandoffIntent(message)) {
    return buildHandoffResponse(state, message);
  }

  // 1) Code shortcut
  const code = extractCode(message);
  if (code) {
    const prop = await getPropertyByCode(sb, code);
    if (prop) {
      const r = buildPropertyResponse(prop, { filters: state } as ConversationState);
      return {
        ...r,
        conversation_state: state,
        total_matches: 1,
      };
    }
  }

  const [rows, entries] = await Promise.all([loadActiveProperties(sb), loadCondoIndex(sb)]);

  // 1.5) Deterministic condo+number resolution (pre-LLM).
  // Garante que "alphaville 1", "alphaville um", "tambore dois" etc.
  // sempre fixem o condomínio canônico, sem depender do LLM.
  let forcedCondo: string | null = null;
  if (message) {
    const cn = findCondoNumber(message);
    if (cn) {
      const candidate = `${cn.group} ${cn.number}`;
      const resolved = resolveCondominium(candidate, entries);
      if (resolved && resolved.confidence === "high") {
        forcedCondo = resolved.entry.canonical;
        state.condominium = forcedCondo;
        state.condominiumGroup = null;
        state.lastDidYouMean = null;
        console.log("[handleConverseV3] forcedCondo via findCondoNumber", { candidate, forcedCondo });
      }
    }
  }

  // 1.6) Deterministic macro-region detection (pre-LLM).
  // Aplica filtros de region/city quando o usuário cita um termo geográfico
  // conhecido que não é condomínio fechado (ex.: "granja viana", "cotia").
  if (message && !forcedCondo) {
    const region = detectRegion(message);
    if (region) {
      if (region.kind === "address") state.address = region.value;
      else if (region.kind === "city") state.city = region.value;
      console.log("[handleConverseV3] region detected", region);
    }
  }

  // 1.7) Desambiguação "alphaville" / "tamboré" sozinhos — bairro vs condomínio.
  // Detecta nesta mensagem OU resgata clarificação pendente de turnos anteriores.
  // Considera "resolvido" se o usuário:
  //   - já tem condomínio/grupo fixado
  //   - menciona "toda" / "região" / "bairro" / "todos" (vai virar grupo)
  //   - menciona número de condo (já tratado em 1.5)
  const buildAmbiguousAreaResponse = (area: "alphaville" | "tambore") => {
    const groupLabel = area === "tambore" ? "Tamboré" : "Alphaville";
    const groupCondos = entries
      .filter((e) => e.normalized.startsWith(area + " "))
      .map((e) => e.canonical)
      .sort((a, b) => {
        const na = parseInt(a.replace(/\D+/g, ""), 10) || 99;
        const nb = parseInt(b.replace(/\D+/g, ""), 10) || 99;
        return na - nb;
      })
      .slice(0, 6);
    const chips: OptionChip[] = [
      {
        label: `Toda a região de ${groupLabel}`,
        value: groupLabel,
        kind: "action",
        action: "set_condominium_group",
        payload: { condominiumGroup: groupLabel },
      },
      ...groupCondos.map((name) => ({
        label: name,
        value: name,
        kind: "condominium",
        action: "set_condominium",
        payload: { condominium: name } as Record<string, unknown>,
      })),
      { label: "Nova busca", value: "reset", kind: "reset" },
    ];
    state.pendingClarification = area;
    return {
      assistantMessage: `Só pra confirmar: quando você fala em **${groupLabel}**, está pensando na **região como um todo** (vários condomínios) ou em um **condomínio específico** (${groupLabel} 1, 2, 3…)? Assim eu te mostro exatamente o que faz sentido.`,
      responseType: "clarification" as const,
      conversation_state: state,
      updatedState: { filters: state } as ConversationState,
      parsedFilters: state,
      suggestedOptions: chips,
      suggestions: chips.map((c) => c.label),
      nextAction: "ask" as const,
    };
  };

  const messageHasRegionResolver = (() => {
    const n = stripAccentsLower(message ?? "");
    return /\b(toda|todas|todos|regiao|região|bairro|geral|qualquer)\b/.test(n);
  })();

  if (
    message &&
    !forcedCondo &&
    !state.condominium &&
    !state.condominiumGroup &&
    !messageHasRegionResolver
  ) {
    const area = detectAmbiguousArea(message) ?? state.pendingClarification ?? null;
    if (area) {
      return buildAmbiguousAreaResponse(area);
    }
  }

  // Resolveu por palavra: "toda região"/"bairro" + clarificação pendente → vira grupo.
  if (
    !forcedCondo &&
    !state.condominium &&
    !state.condominiumGroup &&
    state.pendingClarification &&
    messageHasRegionResolver
  ) {
    state.condominiumGroup = state.pendingClarification === "tambore" ? "Tamboré" : "Alphaville";
    state.pendingClarification = null;
  }


  // 2) LLM intent extraction (if there's an actual user message to interpret)
  let patch: IntentPatch | null = null;
  if (message) {
    patch = await extractSearchIntentV3(sb, message, state, history);
  }
  if (patch) {
    const before = { ...state };
    state = applyPatchV3(state, patch, entries);
    // Guard: LLM não pode inventar filtros numéricos/transação sem evidência textual.
    const rawLower = stripAccentsLower(message).replace(/[^a-z0-9\s]/g, " ");
    const hasDigit = /\d/.test(message);
    const mentionsTransaction = /(venda|vender|comprar|compra|adquirir|alug|loca|arrend)/.test(rawLower);
    const mentionsBedrooms = /(suite|quarto|dormitorio|dorm)/.test(rawLower);
    const mentionsPrice = /(preco|valor|reais|milhao|milhoes|mil|r\$)/.test(rawLower);
    const mentionsArea = /(metro|m2|area)/.test(rawLower);
    if (!hasDigit && !mentionsBedrooms && before.minBedrooms == null && state.minBedrooms != null) {
      console.log("[handleConverseV3] dropping invented minBedrooms", state.minBedrooms);
      state.minBedrooms = before.minBedrooms ?? null;
    }
    if (!hasDigit && !mentionsPrice && before.minPrice == null && state.minPrice != null) {
      console.log("[handleConverseV3] dropping invented minPrice", state.minPrice);
      state.minPrice = before.minPrice ?? null;
    }
    if (!hasDigit && !mentionsPrice && before.maxPrice == null && state.maxPrice != null) {
      console.log("[handleConverseV3] dropping invented maxPrice", state.maxPrice);
      state.maxPrice = before.maxPrice ?? null;
    }
    if (!hasDigit && !mentionsArea && before.minArea == null && state.minArea != null) {
      console.log("[handleConverseV3] dropping invented minArea", state.minArea);
      state.minArea = before.minArea ?? null;
    }
    if (!mentionsTransaction && before.transactionType == null && state.transactionType != null) {
      console.log("[handleConverseV3] dropping invented transactionType", state.transactionType);
      state.transactionType = before.transactionType ?? null;
    }
    if (forcedCondo) {
      // LLM não pode sobrescrever o condomínio resolvido deterministicamente.
      state.condominium = forcedCondo;
      state.condominiumGroup = null;
      state.lastDidYouMean = null;
    }
  }


  // 2.1) LLM-detected handoff intent
  if ((patch as any)?.intent === "handoff") {
    return buildHandoffResponse(state, message);
  }

  // 3) Did-you-mean — ask confirmation before applying
  if (state.lastDidYouMean) {
    const dym = state.lastDidYouMean;
    const suggestion = dym.suggestion;
    const stateOut = { ...state, lastDidYouMean: null };
    if (suggestion) {
      return {
        assistantMessage: `Você quis dizer **${suggestion}**?`,
        responseType: "clarification" as const,
        conversation_state: stateOut,
        updatedState: { filters: stateOut } as ConversationState,
        parsedFilters: stateOut,
        did_you_mean: dym,
        suggestedOptions: [
          { label: `Sim, ${suggestion}`, value: suggestion, kind: "condominium", action: "set_condominium", payload: { condominium: suggestion } },
          { label: "Não, ignorar", value: "skip", kind: "action", action: "clear_condominium" },
        ],
        nextAction: "ask" as const,
      };
    }
    return {
      assistantMessage: `Não localizei nenhum condomínio chamado **${dym.term}** no nosso estoque ativo. Quer me passar outro nome ou seguir sem esse filtro?`,
      responseType: "clarification" as const,
      conversation_state: stateOut,
      updatedState: { filters: stateOut } as ConversationState,
      parsedFilters: stateOut,
      suggestedOptions: [
        { label: "Seguir sem condomínio", value: "any", kind: "action", action: "clear_condominium" },
      ],
      nextAction: "ask" as const,
    };
  }

  // 3.5) Transaction intent guard — preço sem compra/locação gera confusão entre venda x aluguel.
  // Se o usuário mencionou valor mas ainda não disse se quer comprar ou alugar, pergunte antes.
  const hasBudget = (state.minPrice != null) || (state.maxPrice != null);
  if (hasBudget && !state.transactionType) {
    const stateOut = state;
    return {
      assistantMessage:
        `Antes de eu filtrar pelo valor, me confirma: você está pensando em **comprar** ou **alugar**? A faixa de preço muda bastante entre os dois.`,
      responseType: "clarification" as const,
      conversation_state: stateOut,
      updatedState: { filters: stateOut } as ConversationState,
      parsedFilters: stateOut,
      suggestedOptions: [
        { label: "Quero comprar", value: "venda", kind: "transaction", action: "set_transaction" },
        { label: "Quero alugar", value: "locacao", kind: "transaction", action: "set_transaction" },
      ],
      nextAction: "ask" as const,
    };
  }

  // 4) Filter + rank
  const ranked = filterAndRankV3(rows, state);
  const matchCount = ranked.length;
  console.log("[handleConverseV3] final", { message, forcedCondo, state, matchCount });


  const preview = ranked.slice(0, 4).map((m) => rowToResult(m.row));
  const summary = summarizeFiltersV3(state);
  const suggestedOptions = buildDynamicSuggestionsV3(state, matchCount, ranked);

  // 5a) No results — consultive response + WhatsApp handoff option
  if (matchCount === 0) {
    const assistantMessage = (patch?.reply ?? "").trim() || (summary
      ? `Não encontrei imóveis exatamente com **${summary}** no estoque ativo. Posso ajustar os filtros com você ou te direcionar para um consultor da AlphaBusiness verificar opções fora do site.`
      : `Me conta um pouco mais sobre o que você procura: comprar ou alugar? Algum condomínio, faixa de preço ou tipo de imóvel?`);
    const whatsappUrl = buildWhatsAppUrl(state, message);
    const noResultsChips: OptionChip[] = [
      ...suggestedOptions,
      { label: "Falar com consultor", value: "handoff", kind: "handoff", action: "handoff" },
      { label: "Nova busca", value: "reset", kind: "reset" },
    ];
    return {
      assistantMessage,
      responseType: "no_results_explanation" as const,
      conversation_state: state,
      updatedState: { filters: state } as ConversationState,
      parsedFilters: state,
      matchCount,
      total_matches: matchCount,
      suggestedOptions: noResultsChips,
      suggestions: noResultsChips.map((s) => s.label),
      links: [{ label: "Falar com consultor pelo WhatsApp", url: whatsappUrl, type: "whatsapp" as const }],
      nextAction: "ask" as const,
    };
  }

  // 5b) Decide whether to actually show property cards
  const showResults = shouldShowResultsV3({
    message,
    patch,
    selectedOption,
    state,
    matchCount,
  });

  if (showResults) {
    const assistantMessage = (patch?.reply ?? "").trim() || (matchCount === 1
      ? `Encontrei **1 imóvel** com ${summary || "esses critérios"}.`
      : `Aqui estão os imóveis mais compatíveis com ${summary || "sua busca"}.`);
    return {
      assistantMessage,
      responseType: "results_preview" as const,
      conversation_state: state,
      updatedState: { filters: state } as ConversationState,
      parsedFilters: state,
      matchCount,
      total_matches: matchCount,
      resultsPreview: preview,
      suggestedOptions,
      suggestions: suggestedOptions.map((s) => s.label),
      links: [{ label: "Abrir busca completa", url: buildSearchUrl(state), type: "search" as const }],
      nextAction: "show" as const,
    };
  }

  // 5c) Consultive turn — update filters, ask next useful question, do NOT show cards
  let assistantMessage = (patch?.reply ?? "").trim();
  if (!assistantMessage) {
    const missingHint: string[] = [];
    if (!state.transactionType) missingHint.push("se é compra ou locação");
    else if (!state.propertyType && !state.condominium && !state.condominiumGroup) missingHint.push("tipo de imóvel ou condomínio");
    else if (!state.maxPrice && !state.minPrice) missingHint.push("uma faixa de valor");
    else if (!state.minBedrooms) missingHint.push("quantas suítes");
    const ask = missingHint.length
      ? `Quer me contar ${missingHint[0]}, ou prefere que eu já te mostre os imóveis?`
      : `Quer que eu mostre as opções agora ou prefere refinar mais um critério?`;
    assistantMessage = summary
      ? `Filtrei **${summary}**. Encontrei **${matchCount}** ${matchCount === 1 ? "opção compatível" : "opções compatíveis"}. ${ask}`
      : `Posso te ajudar a refinar a busca. ${ask}`;
  }

  const consultiveChips: OptionChip[] = [
    { label: matchCount === 1 ? "Ver imóvel" : `Ver os ${Math.min(matchCount, 50)} resultados`, value: "show_results", kind: "action", action: "show_results" },
    ...suggestedOptions.filter((c) => c.value !== "show_all"),
  ];

  return {
    assistantMessage,
    responseType: "text" as const,
    conversation_state: state,
    updatedState: { filters: state } as ConversationState,
    parsedFilters: state,
    matchCount,
    total_matches: matchCount,
    // No resultsPreview — consultive turn
    suggestedOptions: consultiveChips,
    suggestions: consultiveChips.map((s) => s.label),
    links: [{ label: "Abrir busca completa", url: buildSearchUrl(state), type: "search" as const }],
    nextAction: "ask" as const,
  };
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

    if (body?.action === "converse_v3") {
      const result = await handleConverseV3(supabase, body);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

