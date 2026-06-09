// AlphaBusiness - AI Property Search (Conversational)
// Endpoints (single function, action-based):
//   { query: string }                                            -> legacy text search (kept)
//   { action: "converse", message, currentFilters?, history? }   -> conversational pipeline
//   { action: "search", filters, limit? }                        -> final filtered search
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
interface PropertySearchFilters {
  code?: string | null;
  transactionType?: "venda" | "locacao" | null;
  propertyType?: string | null;
  condominium?: string | null;       // resolved exact name
  condominiumGroup?: string | null;  // ambiguous group (e.g. "Tamboré")
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

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface OptionChip {
  label: string;
  value: string;
  kind: string; // "transaction" | "condominium" | "price" | "bedrooms" | "highlight" | "confirm"
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

// =====================================================================
// Deterministic parsing (code, price, condo with number)
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
  ambiguousValue?: number; // when unit is missing
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

// Match exact "Tamboré N" without confusing 1 vs 10/11
const findCondoNumber = (message: string): { group: string; number: number } | null => {
  const n = norm(message);
  const m = n.match(/\b(tambore|alphaville|residencial)\s+(\d{1,2})\b/);
  if (m) return { group: m[1], number: parseInt(m[2], 10) };
  return null;
};

// Detect group reference without a number (e.g. "no tamboré", "em alphaville")
const findCondoGroup = (message: string): string | null => {
  const n = norm(message);
  const m = n.match(/\b(tambore|alphaville|residencial)\b/);
  return m ? m[1] : null;
};

// Deterministic intent extraction (transaction + property type)
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


// =====================================================================
// Condo resolver
// =====================================================================
let condoCache: { list: string[]; at: number } | null = null;
const CONDO_CACHE_TTL_MS = 10 * 60 * 1000;

const fetchDistinctCondos = async (sb: ReturnType<typeof createClient>): Promise<string[]> => {
  if (condoCache && Date.now() - condoCache.at < CONDO_CACHE_TTL_MS) return condoCache.list;
  const all: string[] = [];
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await sb
      .from("properties")
      .select("condominium")
      .eq("status", "ativo")
      .not("condominium", "is", null)
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    for (const r of data as { condominium: string | null }[]) {
      if (r.condominium) all.push(r.condominium);
    }
    if (data.length < 1000) break;
  }
  const list = Array.from(new Set(all)).sort();
  condoCache = { list, at: Date.now() };
  return list;
};


const resolveCondoByNumber = (
  allCondos: string[],
  group: string,
  number: number,
): string | null => {
  const groupN = norm(group);
  const matches = allCondos.filter((c) => {
    const cn = norm(c);
    if (!cn.includes(groupN)) return false;
    // require exact number boundary
    const re = new RegExp(`\\b${number}\\b`);
    return re.test(cn);
  });
  return matches[0] ?? null;
};

const findCondosByGroup = (allCondos: string[], group: string): string[] => {
  const groupN = norm(group);
  return allCondos.filter((c) => norm(c).includes(groupN));
};

// =====================================================================
// Supabase query builders
// =====================================================================
const PROP_SELECT =
  "id, code, title, condominium, neighborhood, city, price, rental_price, transaction_type, property_type, bedrooms, bathrooms, parking_spots, area_total, photos, is_featured, engineering_highlights, created_at";

const applyHardFilters = (
  q: ReturnType<ReturnType<typeof createClient>["from"]>,
  f: PropertySearchFilters,
) => {
  let query = q.eq("status", "ativo");
  if (f.code) query = query.ilike("code", f.code);
  if (f.transactionType) {
    if (f.transactionType === "locacao") query = query.in("transaction_type", ["locacao", "aluguel"]);
    else query = query.eq("transaction_type", f.transactionType);
  }
  if (f.propertyType) query = query.ilike("property_type", `%${f.propertyType}%`);
  if (f.condominium) query = query.ilike("condominium", f.condominium);
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

const countMatches = async (
  sb: ReturnType<typeof createClient>,
  f: PropertySearchFilters,
): Promise<number> => {
  let q = sb.from("properties").select("id", { count: "exact", head: true });
  q = applyHardFilters(q, f);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
};

const fetchTopMatches = async (
  sb: ReturnType<typeof createClient>,
  f: PropertySearchFilters,
  limit: number,
): Promise<PropertyResult[]> => {
  let q = sb.from("properties").select(PROP_SELECT);
  q = applyHardFilters(q, f);
  q = q.order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  const { data, error } = await q;
  if (error || !data) return [];
  // Optional in-memory boost by highlight tokens
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
  return scored.map(({ p }) => ({
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
  }));
};

// =====================================================================
// LLM (Lovable AI Gateway, Gemini)
// =====================================================================
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const buildSystemPrompt = (condos: string[], currentFilters: PropertySearchFilters) => `
Você é o Rafa IA, consultor digital de imóveis de alto padrão da AlphaBusiness em Alphaville/Tamboré (Brasil).
Sua missão NÃO é mostrar imóveis na primeira mensagem. É CONVERSAR para refinar a busca:
- Interpretar a mensagem livre do usuário em português.
- Extrair e ATUALIZAR filtros estruturados (mantenha os filtros atuais e adicione/altere o necessário).
- Resolver ambiguidades fazendo UMA pergunta curta e objetiva por vez.
- Sugerir 3-5 botões rápidos (chips) relevantes ao próximo passo.
- Se faltar pelo menos uma definição clara (transação, condomínio OU faixa de preço), faça pergunta de refinamento.
- NUNCA invente imóveis. Não cite códigos.
- Tom: caloroso, consultivo, conciso (máx. 2 frases curtas).

Condomínios reais no banco (use apenas estes nomes em "condominium"; "Tamboré 1" ≠ "Tamboré 10"):
${condos.slice(0, 80).join(" | ")}

Filtros atuais já preenchidos:
${JSON.stringify(currentFilters)}

Responda SEMPRE em JSON estrito com este schema:
{
  "assistantMessage": string,
  "parsedFilters": {
    "transactionType": "venda"|"locacao"|null,
    "propertyType": string|null,
    "condominium": string|null,
    "condominiumGroup": string|null,
    "city": string|null,
    "neighborhood": string|null,
    "minBedrooms": number|null,
    "minBathrooms": number|null,
    "minParking": number|null,
    "minArea": number|null,
    "minPrice": number|null,
    "maxPrice": number|null,
    "highlights": string[]
  },
  "suggestedOptions": [{"label": string, "value": string, "kind": string}],
  "nextAction": "ask" | "confirm" | "show",
  "clarificationType": "transaction"|"condominium_number"|"price_unit"|"broaden"|"narrow"|null
}
`.trim();

interface LLMResult {
  data?: any;
  status?: "ok" | "rate_limited" | "credits_exhausted" | "no_key" | "error";
}

const callLLM = async (
  message: string,
  currentFilters: PropertySearchFilters,
  history: ConversationMessage[],
  condos: string[],
): Promise<LLMResult> => {
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY missing in ai-property-search");
    return { status: "no_key" };
  }
  try {
    const messages = [
      { role: "system", content: buildSystemPrompt(condos, currentFilters) },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("LLM error", res.status, txt);
      if (res.status === 429) return { status: "rate_limited" };
      if (res.status === 402) return { status: "credits_exhausted" };
      return { status: "error" };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return { status: "error" };
    try {
      return { data: JSON.parse(content), status: "ok" };
    } catch (e) {
      console.error("LLM JSON parse error", e, content);
      return { status: "error" };
    }
  } catch (e) {
    console.error("LLM exception", e);
    return { status: "error" };
  }
};


// =====================================================================
// Conversation pipeline
// =====================================================================
const mergeFilters = (
  base: PropertySearchFilters,
  add: PropertySearchFilters,
): PropertySearchFilters => {
  const out: PropertySearchFilters = { ...base };
  for (const k of Object.keys(add) as (keyof PropertySearchFilters)[]) {
    const v = add[k];
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    // @ts-ignore
    out[k] = v;
  }
  return out;
};

const handleConverse = async (
  sb: ReturnType<typeof createClient>,
  body: { message: string; currentFilters?: PropertySearchFilters; history?: ConversationMessage[] },
) => {
  const message = String(body.message ?? "").trim();
  const current: PropertySearchFilters = body.currentFilters ?? { highlights: [] };
  const history = Array.isArray(body.history) ? body.history : [];

  // 1) Code shortcut
  const code = extractCode(message);
  if (code) {
    const { data } = await sb
      .from("properties")
      .select(PROP_SELECT)
      .ilike("code", code)
      .eq("status", "ativo")
      .limit(1);
    if (data && data.length > 0) {
      const p = data[0] as any;
      const result: PropertyResult = {
        id: p.id, code: p.code, title: p.title, condominium: p.condominium,
        neighborhood: p.neighborhood, city: p.city, price: p.price,
        rental_price: p.rental_price, transaction_type: p.transaction_type,
        bedrooms: p.bedrooms, bathrooms: p.bathrooms, parking_spots: p.parking_spots,
        area_total: p.area_total, photo: (p.photos && p.photos[0]) || null,
        relevance_reason: `Código exato ${p.code}`,
      };
      return {
        assistantMessage: `Encontrei o imóvel **${p.code}**${p.condominium ? ` no ${p.condominium}` : ""}. Quer ver os detalhes?`,
        parsedFilters: { ...current, code: p.code },
        suggestedOptions: [
          { label: "Ver detalhes", value: "view", kind: "navigate" },
          { label: "Nova busca", value: "reset", kind: "reset" },
        ],
        matchCount: 1,
        showResults: true,
        resultsPreview: [result],
        nextAction: "show",
      };
    }
    return {
      assistantMessage: `Não localizei o código **${code}** no nosso estoque ativo. Quer me contar o que procura?`,
      parsedFilters: current,
      suggestedOptions: defaultStartChips(),
      nextAction: "ask",
    };
  }

  // 2) Deterministic parsing (price + condo number)
  const det: PropertySearchFilters = {};
  const priceParse = parsePrice(message);
  if (priceParse.minPrice) det.minPrice = priceParse.minPrice;
  if (priceParse.maxPrice) det.maxPrice = priceParse.maxPrice;

  const allCondos = await fetchDistinctCondos(sb);
  const condoNum = findCondoNumber(message);
  if (condoNum) {
    const resolved = resolveCondoByNumber(allCondos, condoNum.group, condoNum.number);
    if (resolved) det.condominium = resolved;
  }

  // Ambiguous price (e.g. "até 900")
  if (priceParse.ambiguousValue) {
    return {
      assistantMessage: `Quando você diz **${priceParse.ambiguousValue}**, quer dizer R$ ${priceParse.ambiguousValue} mil ou R$ ${priceParse.ambiguousValue} milhões?`,
      parsedFilters: current,
      suggestedOptions: [
        { label: `R$ ${priceParse.ambiguousValue} mil`, value: String(priceParse.ambiguousValue * 1000), kind: "price_max" },
        { label: `R$ ${priceParse.ambiguousValue} milhões`, value: String(priceParse.ambiguousValue * 1_000_000), kind: "price_max" },
      ],
      clarificationType: "price_unit",
      nextAction: "ask",
    };
  }

  // 3) LLM enrichment
  const llm = await callLLM(message, mergeFilters(current, det), history, allCondos);
  let merged = mergeFilters(current, det);
  let assistantMessage = "Entendi. Pode me contar um pouco mais?";
  let suggestedOptions: OptionChip[] = defaultStartChips();
  let nextAction: "ask" | "confirm" | "show" = "ask";
  let clarificationType: string | null = null;

  if (llm) {
    if (llm.parsedFilters) merged = mergeFilters(merged, llm.parsedFilters as PropertySearchFilters);
    if (typeof llm.assistantMessage === "string") assistantMessage = llm.assistantMessage;
    if (Array.isArray(llm.suggestedOptions)) suggestedOptions = llm.suggestedOptions;
    if (llm.nextAction) nextAction = llm.nextAction;
    if (llm.clarificationType) clarificationType = llm.clarificationType;
  }

  // 4) Resolve condominium ambiguity (e.g. "Tamboré" sem número)
  if (!merged.condominium && merged.condominiumGroup) {
    const options = findCondosByGroup(allCondos, merged.condominiumGroup);
    if (options.length > 1) {
      return {
        assistantMessage: `Existem várias opções em **${merged.condominiumGroup}**. Tem alguma preferência?`,
        parsedFilters: merged,
        suggestedOptions: [
          ...options.slice(0, 6).map((c) => ({ label: c, value: c, kind: "condominium" })),
          { label: "Me mostre opções", value: "all", kind: "condominium_any" },
        ],
        clarificationType: "condominium_number",
        nextAction: "ask",
      };
    }
    if (options.length === 1) merged.condominium = options[0];
  }

  // 5) Count and decide
  const hasAnyFilter = Object.entries(merged).some(([k, v]) => {
    if (k === "highlights") return Array.isArray(v) && (v as string[]).length > 0;
    return v !== null && v !== undefined && v !== "";
  });

  let matchCount: number | undefined;
  if (hasAnyFilter) matchCount = await countMatches(sb, merged);

  if (matchCount === 0) {
    return {
      assistantMessage: `Com esse filtro encontrei poucas opções. Quer que eu amplie o valor, considere apartamentos ou veja condomínios parecidos?`,
      parsedFilters: merged,
      suggestedOptions: [
        { label: "Ampliar preço", value: "broaden_price", kind: "refine" },
        { label: "Outros condomínios", value: "any_condo", kind: "refine" },
        { label: "Considerar apartamentos", value: "apartamento", kind: "propertyType" },
      ],
      matchCount,
      clarificationType: "broaden",
      nextAction: "ask",
    };
  }

  if (nextAction === "show" && matchCount && matchCount > 0 && matchCount <= 60) {
    const preview = await fetchTopMatches(sb, merged, 4);
    return {
      assistantMessage: `Encontrei **${matchCount}** ${matchCount === 1 ? "imóvel" : "imóveis"} que combinam com você. Quer ver todos ou refinar mais?`,
      parsedFilters: merged,
      suggestedOptions: [
        { label: "Ver todos os resultados", value: "show_all", kind: "navigate" },
        { label: "Refinar busca", value: "refine", kind: "refine" },
      ],
      matchCount,
      showResults: true,
      resultsPreview: preview,
      nextAction: "show",
    };
  }

  if (matchCount && matchCount > 60) {
    return {
      assistantMessage: `Encontrei cerca de **${matchCount}** imóveis. Para te mostrar opções mais certeiras, prefere filtrar por condomínio, metragem, suítes ou estilo do imóvel?`,
      parsedFilters: merged,
      suggestedOptions: [
        { label: "Escolher condomínio", value: "condo", kind: "refine" },
        { label: "Definir metragem", value: "area", kind: "refine" },
        { label: "Mais suítes", value: "bedrooms", kind: "refine" },
        { label: "Piscina/Gourmet", value: "piscina,gourmet", kind: "highlight" },
        { label: "Ver resultados agora", value: "show_all", kind: "navigate" },
      ],
      matchCount,
      clarificationType: "narrow",
      nextAction: "ask",
    };
  }

  return {
    assistantMessage,
    parsedFilters: merged,
    suggestedOptions,
    matchCount,
    clarificationType,
    nextAction,
  };
};

const defaultStartChips = (): OptionChip[] => [
  { label: "Comprar", value: "venda", kind: "transaction" },
  { label: "Alugar", value: "locacao", kind: "transaction" },
  { label: "Tenho um código", value: "code", kind: "code" },
];

// =====================================================================
// Legacy text search (kept for backward compatibility)
// =====================================================================
const legacySearch = async (sb: ReturnType<typeof createClient>, query: string) => {
  // Use the same filter pipeline by treating query as a free text → very small heuristic
  const code = extractCode(query);
  const f: PropertySearchFilters = {};
  if (code) f.code = code;
  const price = parsePrice(query);
  if (price.minPrice) f.minPrice = price.minPrice;
  if (price.maxPrice) f.maxPrice = price.maxPrice;
  if (/\b(alug|loca)/i.test(query)) f.transactionType = "locacao";
  else if (/\b(vend|comprar)/i.test(query)) f.transactionType = "venda";

  const allCondos = await fetchDistinctCondos(sb);
  const condoNum = findCondoNumber(query);
  if (condoNum) {
    const resolved = resolveCondoByNumber(allCondos, condoNum.group, condoNum.number);
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

    if (body?.action === "converse") {
      const result = await handleConverse(supabase, body);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body?.action === "search") {
      const filters: PropertySearchFilters = body.filters ?? {};
      const limit = Math.min(Math.max(Number(body.limit) || 24, 1), 60);
      const results = await fetchTopMatches(supabase, filters, limit);
      return new Response(JSON.stringify({ results, parsed_filters: filters }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Legacy
    const q = typeof body?.query === "string" ? body.query : "";
    const out = await legacySearch(supabase, q);
    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-property-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
