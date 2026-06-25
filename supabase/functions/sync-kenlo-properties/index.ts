// Sync properties from Kenlo (ValueGaia) XML feed.
// - Upsert by `code` (uses Reference + suffix -V/-L when both prices exist)
// - Tombstones only `source = 'kenlo'` rows missing from feed
// - Preserves manually-entered properties (source != 'kenlo')
// - Captures outbound IP for Kenlo whitelisting diagnostics
// - Reads dynamic config from site_settings.kenlo_sync_config
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SyncConfig = {
  import_sale: boolean;
  import_rental: boolean;
  split_dual: boolean;
  min_price: number;
  max_price: number;
  allowed_property_types: string[];
  allowed_condominiums: string[];
  missing_behavior: "inativar" | "manter" | "deletar";
  protected_fields: string[];
};

type ExistingKenloRow = {
  id: string;
  code: string;
} & Record<string, unknown>;

const DEFAULT_CONFIG: SyncConfig = {
  import_sale: true,
  import_rental: true,
  split_dual: true,
  min_price: 0,
  max_price: 0,
  allowed_property_types: [],
  allowed_condominiums: [],
  missing_behavior: "inativar",
  protected_fields: ["is_featured", "engineering_highlights"],
};

function parseBR(value: unknown): number | null {
  if (value == null) return null;
  let s = String(value).trim();
  if (!s) return null;
  s = s.replace(/R\$/gi, "").replace(/\s/g, "");
  // Detect format: if contains comma -> BR (1.234.567,89). Else US/decimal (7000000.00).
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  // else: leave dots as decimal separator
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toInt(value: unknown): number | null {
  if (value == null) return null;
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

async function fetchAllPages<T>(
  buildQuery: () => { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }> },
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function normalizePropertyType(raw: unknown): string {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s.includes("apart")) return "apartamento";
  if (s.includes("casa") && s.includes("cond")) return "casa em condominio";
  if (s.includes("casa")) return "casa";
  if (s.includes("terreno") || s.includes("lote")) return "terreno";
  if (s.includes("cobert")) return "cobertura";
  if (s.includes("comerc") || s.includes("sala")) return "comercial";
  return s || "casa";
}

async function getOutboundIp(): Promise<string> {
  const endpoints = [
    "https://api.ipify.org?format=json",
    "https://ifconfig.me/ip",
    "https://ipinfo.io/ip",
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) continue;
      const txt = (await r.text()).trim();
      if (url.includes("ipify")) {
        try { return JSON.parse(txt).ip ?? "unknown"; } catch { return txt; }
      }
      return txt;
    } catch {
      continue;
    }
  }
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  let outboundIp = "unknown";

  try {
    outboundIp = await getOutboundIp();
    console.log("[kenlo-sync] outbound_ip:", outboundIp);

    const KENLO_URL = Deno.env.get("KENLO_XML_URL");
    if (!KENLO_URL) throw new Error("KENLO_XML_URL não configurado");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Persist last outbound IP for the admin UI
    await admin.from("site_settings").upsert(
      {
        key: "kenlo_last_outbound_ip",
        value: { ip: outboundIp, checked_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    // Load dynamic sync config
    const { data: cfgRow } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "kenlo_sync_config")
      .maybeSingle();
    const config: SyncConfig = {
      ...DEFAULT_CONFIG,
      ...((cfgRow?.value as Partial<SyncConfig>) ?? {}),
    };

    const xmlResp = await fetch(KENLO_URL, {
      headers: { "User-Agent": "AlphaBusiness-Sync/1.0" },
      signal: AbortSignal.timeout(45000),
    });

    if (!xmlResp.ok) {
      const bodyPreview = await xmlResp.text().catch(() => "");
      const status = xmlResp.status;
      const isIpBlock = status === 403 || status === 401;
      const msg = isIpBlock
        ? `Kenlo bloqueou o acesso (HTTP ${status}). Provável restrição por IP. Envie o IP de saída para a Kenlo liberar.`
        : `Kenlo retornou HTTP ${status}: ${bodyPreview.slice(0, 200)}`;

      await admin.from("system_audit_logs").insert({
        action: "sincronizou",
        object_type: "kenlo_sync",
        object_label: "Falha",
        user_name: "Sistema",
        metadata: { error: msg, outbound_ip: outboundIp, status },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: msg,
          outbound_ip: outboundIp,
          status,
          duration_ms: Date.now() - startedAt,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const xmlText = await xmlResp.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,
      trimValues: true,
    });
    const parsed = parser.parse(xmlText);

    const root: any = parsed?.Carga ?? parsed?.carga ?? parsed?.ListingDataFeed ?? parsed;
    const imoveisNode =
      root?.Imoveis?.Imovel ??
      root?.Imoveis?.imovel ??
      root?.Listings?.Listing ??
      root?.imoveis?.imovel ??
      [];
    const imoveis = toArray<any>(imoveisNode);

    console.log(`[kenlo-sync] parsed ${imoveis.length} imóveis from feed`);

    const rows: any[] = [];
    const seenCodes = new Set<string>();

    for (const im of imoveis) {
      const ref = String(
        im?.CodigoImovel ?? im?.Referencia ?? im?.codigo ?? im?.Codigo ?? im?.["@_id"] ?? "",
      ).trim();
      if (!ref) continue;

      const tipo = normalizePropertyType(
        im?.TipoImovel ?? im?.SubTipoImovel ?? im?.Categoria ?? im?.Tipo,
      );
      if (config.allowed_property_types.length > 0 && !config.allowed_property_types.includes(tipo)) continue;

      const condo = String(im?.Condominio ?? im?.NomeCondominio ?? im?.Empreendimento ?? "").trim() || null;
      if (config.allowed_condominiums.length > 0 && condo && !config.allowed_condominiums.includes(condo)) continue;

      const precoVenda = parseBR(im?.PrecoVenda ?? im?.ValorVenda ?? im?.Preco);
      const precoLocacao = parseBR(im?.PrecoLocacao ?? im?.ValorLocacao ?? im?.PrecoAluguel);
      const valorCondominio = parseBR(im?.ValorCondominio ?? im?.PrecoCondominio ?? im?.TaxaCondominio);
      const valorIptu = parseBR(im?.ValorIPTU ?? im?.PrecoIPTU ?? im?.IPTU ?? im?.ValorIptu);

      const passPrice = (p: number | null) =>
        p != null && p >= (config.min_price || 0) && (config.max_price === 0 || p <= config.max_price);

      const hasV = config.import_sale && passPrice(precoVenda);
      const hasL = config.import_rental && passPrice(precoLocacao);
      if (!hasV && !hasL) continue;

      const fotosNode = im?.Fotos?.Foto ?? im?.Imagens?.Imagem ?? im?.Photos?.Photo ?? [];
      const photos: string[] = toArray<any>(fotosNode)
        .map((f: any) => {
          if (typeof f === "string") return f;
          return f?.URLArquivo ?? f?.Url ?? f?.url ?? f?.["#text"] ?? null;
        })
        .filter((u: any): u is string => typeof u === "string" && u.startsWith("http"));

      const cityFromXml = String(im?.Cidade ?? "").trim();
      const neighborhoodFromXml = String(im?.Bairro ?? "").trim();

      // Endereço: feed da Kenlo retorna "ENDEREÇO NÃO INFORMADO" para ~100% dos imóveis (privacidade).
      // Tratamos como nulo para permitir preenchimento manual no painel.
      const rawAddress = String(im?.Endereco ?? im?.Logradouro ?? "").trim();
      const isPlaceholderAddress = /endere[çc]o\s+n[ãa]o\s+informado/i.test(rawAddress);
      const address = !rawAddress || isPlaceholderAddress ? null : rawAddress;

      // Título: prioriza TituloImovel (descritivo profissional do XML), depois TituloAnuncio,
      // por último monta um fallback "tipo - condomínio".
      const xmlTitle = String(
        im?.TituloImovel ?? im?.TituloAnuncio ?? im?.Titulo ?? "",
      ).trim();
      const finalTitle = xmlTitle || `${tipo} - ${condo ?? ref}`;

      const base: Record<string, unknown> = {
        title: finalTitle.slice(0, 250),
        description: String(im?.Observacao ?? im?.Descricao ?? "") || null,
        property_type: tipo,
        condominium: condo,
        address,
        city: cityFromXml || "Barueri",
        neighborhood: neighborhoodFromXml || "Alphaville",
        bedrooms: toInt(im?.QtdDormitorios ?? im?.Dormitorios ?? 0) ?? 0,
        bathrooms: toInt(im?.QtdBanheiros ?? im?.Banheiros ?? 0) ?? 0,
        parking_spots: toInt(im?.QtdVagas ?? im?.Vagas ?? 0) ?? 0,
        area_total: parseBR(im?.AreaTotal ?? im?.AreaTerreno),
        area_built: parseBR(im?.AreaUtil ?? im?.AreaConstruida),
        photos,
        source: "kenlo",
        external_id: ref,
        last_synced_at: new Date().toISOString(),
        status: "ativo",
      };

      if (hasV && hasL) {
        // Unified record: single property with both prices.
        rows.push({ ...base, code: ref, transaction_type: "ambos", price: precoVenda, rental_price: precoLocacao });
        seenCodes.add(ref);
      } else if (hasV) {
        rows.push({ ...base, code: ref, transaction_type: "venda", price: precoVenda, rental_price: null });
        seenCodes.add(ref);
      } else if (hasL) {
        rows.push({ ...base, code: ref, transaction_type: "locacao", price: null, rental_price: precoLocacao });
        seenCodes.add(ref);
      }

    }

    // Fetch existing kenlo rows for protected fields preservation
    const protectedSelect = ["id", "code", ...config.protected_fields].join(", ");
    const existingRows = await fetchAllPages<ExistingKenloRow>(() =>
      admin
        .from("properties")
        .select(protectedSelect)
        .eq("source", "kenlo")
    );
    const existingMap = new Map(existingRows.map((r) => [r.code, r]));

    let created = 0;
    let updated = 0;
    const BATCH = 100;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map((row) => {
        const existing = existingMap.get(row.code);
        if (existing) {
          const preserved: Record<string, unknown> = {};
          for (const f of config.protected_fields) {
            if (existing[f] != null) preserved[f] = existing[f];
          }
          return { ...row, ...preserved };
        }
        return row;
      });

      const { error: upErr } = await admin
        .from("properties")
        .upsert(batch, { onConflict: "code" });
      if (upErr) {
        console.error("[kenlo-sync] upsert error:", upErr);
        throw upErr;
      }

      for (const row of batch) {
        if (existingMap.has(row.code)) updated++;
        else created++;
      }
    }

    let deactivated = 0;
    if (config.missing_behavior !== "manter" && seenCodes.size > 0) {
      const kenloRows = await fetchAllPages<{ id: string; code: string }>(() =>
        admin
          .from("properties")
          .select("id, code")
          .eq("source", "kenlo")
      );
      const missingIds = kenloRows.filter((r) => !seenCodes.has(r.code)).map((r) => r.id);
      if (missingIds.length > 0) {
        if (config.missing_behavior === "deletar") {
          const { error } = await admin.from("properties").delete().in("id", missingIds);
          if (!error) deactivated = missingIds.length;
        } else {
          const { error } = await admin.from("properties").update({ status: "inativo" }).in("id", missingIds);
          if (!error) deactivated = missingIds.length;
        }
      }
    }

    const duration_ms = Date.now() - startedAt;

    await admin.from("system_audit_logs").insert({
      action: "sincronizou",
      object_type: "kenlo_sync",
      object_label: `${created + updated} imóveis`,
      user_name: "Sistema",
      metadata: { created, updated, deactivated, duration_ms, outbound_ip: outboundIp },
    });

    return new Response(
      JSON.stringify({
        success: true,
        created,
        updated,
        deactivated,
        total_in_feed: imoveis.length,
        duration_ms,
        outbound_ip: outboundIp,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[kenlo-sync] fatal:", msg);
    return new Response(
      JSON.stringify({
        success: false,
        error: msg,
        outbound_ip: outboundIp,
        duration_ms: Date.now() - startedAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
