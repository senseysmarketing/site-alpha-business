// Sync properties from Kenlo (ValueGaia) XML feed.
// - Upsert by `code` (uses Reference + suffix -V/-L when both prices exist)
// - Tombstones only `source = 'kenlo'` rows missing from feed
// - Preserves manually-entered properties
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const KENLO_XML_URL = Deno.env.get("KENLO_XML_URL")!;

// ---------- helpers ----------

function parseBR(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;
  // Strip "R$", spaces, dots (thousands), then swap comma for dot.
  const cleaned = s.replace(/R\$/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toInt(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

function normalizePropertyType(raw: string | null): string {
  if (!raw) return "casa";
  const s = raw.toLowerCase();
  if (s.includes("apart") || s.includes("flat")) return "apartamento";
  if (s.includes("terreno") || s.includes("lote")) return "terreno";
  if (s.includes("cobertura")) return "cobertura";
  if (s.includes("comercial") || s.includes("sala")) return "comercial";
  return "casa";
}

function extractPhotos(fotosNode: unknown): string[] {
  // Common Kenlo shapes: { Foto: [{ URLArquivo: "..." }, ...] } or { Foto: { URLArquivo } }
  if (!fotosNode || typeof fotosNode !== "object") return [];
  const fotosObj = fotosNode as Record<string, unknown>;
  const fotos = asArray(fotosObj.Foto ?? fotosObj.foto);
  return fotos
    .map((f) => {
      if (typeof f === "string") return f;
      const o = f as Record<string, unknown>;
      return pick(o, "URLArquivo", "URL", "Url", "url") ?? "";
    })
    .filter((u) => !!u);
}

function buildBaseRow(imovel: Record<string, unknown>) {
  const ref = pick(imovel, "CodigoImovel", "Referencia", "ReferenciaImovel", "Codigo");
  const externalId = pick(imovel, "IDImovel", "ID", "Id");
  const title =
    pick(imovel, "TituloImovel", "TituloAnuncio", "Titulo") ??
    `Imóvel ${ref ?? externalId ?? "sem código"}`;
  const description = pick(imovel, "DescricaoImovel", "Descricao", "Observacao");
  const propertyType = normalizePropertyType(pick(imovel, "TipoImovel", "SubTipoImovel", "Tipo"));
  const condominium = pick(imovel, "NomeEdificio", "Condominio", "NomeCondominio");
  const address = [
    pick(imovel, "Endereco", "Logradouro"),
    pick(imovel, "Numero"),
  ].filter(Boolean).join(", ") || null;
  const neighborhood = pick(imovel, "Bairro") ?? "Alphaville";
  const city = pick(imovel, "Cidade") ?? "Barueri";

  const bedrooms = toInt(pick(imovel, "QtdDormitorios", "Dormitorios", "Quartos"));
  const bathrooms = toInt(pick(imovel, "QtdBanheiros", "Banheiros"));
  const parkingSpots = toInt(pick(imovel, "QtdVagas", "Vagas", "Garagem"));
  const areaTotal = parseBR(pick(imovel, "AreaTotal", "AreaTerreno"));
  const areaBuilt = parseBR(pick(imovel, "AreaUtil", "AreaConstruida", "AreaPrivativa"));
  const videoUrl = pick(imovel, "URLVideo", "VideoURL", "Video");

  const photos = extractPhotos(imovel.Fotos ?? imovel.fotos);

  return {
    ref,
    externalId,
    base: {
      title,
      description,
      property_type: propertyType,
      condominium,
      address,
      neighborhood,
      city,
      bedrooms,
      bathrooms,
      parking_spots: parkingSpots,
      area_total: areaTotal,
      area_built: areaBuilt,
      video_url: videoUrl,
      photos: photos.length ? photos : null,
      source: "kenlo",
      external_id: externalId,
      last_synced_at: new Date().toISOString(),
      status: "ativo" as const,
    },
  };
}

// ---------- handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth: must be admin
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = Date.now();
    const debugMode = new URL(req.url).searchParams.get("debug") === "1";

    // Diagnostic: outbound IP (helps user whitelist on ValueGaia panel)
    let outboundIp: string | null = null;
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipJson = await ipRes.json();
      outboundIp = ipJson?.ip ?? null;
    } catch (_) { /* ignore */ }

    if (debugMode) {
      return new Response(JSON.stringify({ outbound_ip: outboundIp }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch XML
    const xmlRes = await fetch(KENLO_XML_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlphaBusinessSync/1.0)",
        "Accept": "application/xml, text/xml, */*",
      },
    });
    if (!xmlRes.ok) {
      const body = await xmlRes.text();
      return new Response(JSON.stringify({
        error: `Falha ao buscar XML (HTTP ${xmlRes.status})`,
        outbound_ip: outboundIp,
        hint: "Se o token estiver restrito por IP, cadastre o outbound_ip no painel ValueGaia.",
        snippet: body.slice(0, 300),
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const xml = await xmlRes.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      trimValues: true,
    });
    const parsed = parser.parse(xml);

    // Try common roots
    const root = parsed?.Carga ?? parsed?.Imoveis ?? parsed?.GaiaImoveis ?? parsed;
    const imoveis = asArray(root?.Imoveis?.Imovel ?? root?.Imovel ?? root?.imovel);

    if (!imoveis.length) {
      return new Response(JSON.stringify({
        error: "Nenhum imóvel encontrado no XML.",
        root_keys: Object.keys(parsed ?? {}),
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build rows (split V/L)
    const rows: Array<Record<string, unknown>> = [];
    const seenCodes = new Set<string>();
    const errors: string[] = [];

    for (const imovel of imoveis) {
      try {
        const { ref, base } = buildBaseRow(imovel as Record<string, unknown>);
        if (!ref) { errors.push("Imóvel sem CodigoImovel/Referencia ignorado"); continue; }

        const precoVenda = parseBR(pick(imovel as Record<string, unknown>, "PrecoVenda", "ValorVenda"));
        const precoLocacao = parseBR(pick(imovel as Record<string, unknown>, "PrecoLocacao", "ValorLocacao", "ValorAluguel"));

        const hasV = precoVenda !== null && precoVenda > 0;
        const hasL = precoLocacao !== null && precoLocacao > 0;

        if (hasV && hasL) {
          const codeV = `${ref}-V`;
          const codeL = `${ref}-L`;
          if (!seenCodes.has(codeV)) {
            rows.push({ ...base, code: codeV, transaction_type: "venda", price: precoVenda, rental_price: null });
            seenCodes.add(codeV);
          }
          if (!seenCodes.has(codeL)) {
            rows.push({ ...base, code: codeL, transaction_type: "locacao", price: null, rental_price: precoLocacao });
            seenCodes.add(codeL);
          }
        } else if (hasV) {
          if (!seenCodes.has(ref)) {
            rows.push({ ...base, code: ref, transaction_type: "venda", price: precoVenda, rental_price: null });
            seenCodes.add(ref);
          }
        } else if (hasL) {
          if (!seenCodes.has(ref)) {
            rows.push({ ...base, code: ref, transaction_type: "locacao", price: null, rental_price: precoLocacao });
            seenCodes.add(ref);
          }
        } else {
          // No price -> still upsert as 'venda' with null price, marked active
          if (!seenCodes.has(ref)) {
            rows.push({ ...base, code: ref, transaction_type: "venda", price: null, rental_price: null });
            seenCodes.add(ref);
          }
        }
      } catch (e) {
        errors.push(`Erro ao mapear imóvel: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Count current kenlo properties (for delta)
    const { data: existing } = await admin
      .from("properties")
      .select("code")
      .eq("source", "kenlo");
    const existingCodes = new Set((existing ?? []).map((r) => r.code));

    let created = 0;
    let updated = 0;
    for (const code of seenCodes) {
      if (existingCodes.has(code)) updated++; else created++;
    }

    // Upsert in batches of 100
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      const { error: upErr } = await admin
        .from("properties")
        .upsert(slice, { onConflict: "code", ignoreDuplicates: false });
      if (upErr) {
        errors.push(`Upsert batch ${i / BATCH}: ${upErr.message}`);
      }
    }

    // Tombstone: kenlo properties absent in this feed
    let deactivated = 0;
    const codesArray = Array.from(seenCodes);
    if (codesArray.length > 0) {
      const { data: deact, error: deactErr } = await admin
        .from("properties")
        .update({ status: "inativo", last_synced_at: new Date().toISOString() })
        .eq("source", "kenlo")
        .eq("status", "ativo")
        .not("code", "in", `(${codesArray.map((c) => `"${c}"`).join(",")})`)
        .select("id");
      if (deactErr) errors.push(`Tombstone: ${deactErr.message}`);
      deactivated = deact?.length ?? 0;
    }

    const durationMs = Date.now() - startedAt;
    const summary = {
      ok: true,
      created,
      updated,
      deactivated,
      total_in_feed: rows.length,
      errors,
      outbound_ip: outboundIp,
      duration_ms: durationMs,
    };

    // Audit log
    await admin.from("system_audit_logs").insert({
      action: "sync",
      object_type: "properties",
      user_id: userData.user.id,
      user_name: userData.user.email ?? "Admin",
      object_label: "Sincronização Kenlo",
      metadata: summary,
    });

    return new Response(JSON.stringify(summary), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
