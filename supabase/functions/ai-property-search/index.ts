import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [], parsed_filters: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: properties, error } = await supabase
      .from("properties")
      .select(
        "id, code, title, description, property_type, transaction_type, condominium, neighborhood, city, address, price, rental_price, bedrooms, bathrooms, parking_spots, area_total, area_built, engineering_highlights, photos, status, is_featured"
      )
      .eq("status", "ativo");

    if (error) {
      console.error("DB error:", error);
      throw new Error("Failed to fetch properties");
    }

    const safeProperties = properties || [];

    const propertyContext = safeProperties.map((p) => {
      const parts = [
        `ID: ${p.id}`,
        `Código: ${p.code}`,
        `Título: ${p.title}`,
        p.description ? `Descrição: ${p.description}` : null,
        `Tipo: ${p.property_type}`,
        `Transação: ${p.transaction_type}`,
        p.condominium ? `Condomínio: ${p.condominium}` : null,
        p.neighborhood ? `Bairro: ${p.neighborhood}` : null,
        p.city ? `Cidade: ${p.city}` : null,
        p.address ? `Endereço: ${p.address}` : null,
        p.price ? `Preço venda: R$ ${Number(p.price).toLocaleString("pt-BR")}` : null,
        p.rental_price ? `Aluguel: R$ ${Number(p.rental_price).toLocaleString("pt-BR")}` : null,
        p.bedrooms ? `Quartos: ${p.bedrooms}` : null,
        p.bathrooms ? `Banheiros: ${p.bathrooms}` : null,
        p.parking_spots ? `Vagas: ${p.parking_spots}` : null,
        p.area_total ? `Área total: ${p.area_total}m²` : null,
        p.area_built ? `Área construída: ${p.area_built}m²` : null,
        p.engineering_highlights?.length
          ? `Destaques: ${p.engineering_highlights.join(", ")}`
          : null,
        p.is_featured ? `Destaque: Sim` : null,
      ];
      return parts.filter(Boolean).join(" | ");
    }).join("\n---\n");

    const systemPrompt = `Você é um concierge imobiliário de luxo especializado em Alphaville e região. Você tem acesso a uma lista de imóveis disponíveis. Sua tarefa é analisar a busca do usuário, extrair os filtros implícitos e retornar os imóveis mais relevantes.

IMÓVEIS DISPONÍVEIS:
${propertyContext || "Nenhum imóvel cadastrado no momento."}

REGRAS DE INTERPRETAÇÃO:
- Valores monetários: interprete "até 12M" como max 12.000.000, "entre 8 e 10 milhões" como range, "mínimo 5M" como min 5.000.000, "abaixo de 3mi" como max 3.000.000
- Atributos físicos: "4 quartos" ou "4 suítes" → bedrooms_min: 4, "mais de 400m²" → area_min: 400, "3 vagas" → parking_min: 3
- Localização: reconheça variantes de condomínios como "Res. 1", "Residencial 1", "Residencial Um", "Tamboré", "Tambore" e normalize para o nome correto do banco
- Qualitativos: termos como "moderna", "clássica", "reformada", "face norte", "piso aquecido", "adega", "automação" devem ser buscados na descrição e destaques de engenharia
- Tipo de transação: "para alugar" ou "aluguel" → transaction_type: "aluguel", "comprar" ou "venda" → transaction_type: "venda"
- Se a busca for por código (ex: "AB001"), busque exatamente esse código
- Retorne no máximo 6 imóveis mais relevantes
- Sempre forneça uma razão curta de por que cada imóvel é relevante
- CRÍTICO: Se nenhum imóvel corresponder à busca do usuário, retorne matches como array VAZIO []. NÃO force resultados irrelevantes.
- Só retorne imóveis que realmente atendam pelo menos um critério explícito da busca do usuário.
- Se a busca for vaga ou genérica (ex: apenas "casa"), priorize imóveis em destaque (is_featured).
- IMPORTANTE: extraia todos os filtros implícitos na busca do usuário e retorne no campo parsed_filters`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "search_properties",
                description:
                  "Return the most relevant properties and the parsed filters extracted from the user query.",
                parameters: {
                  type: "object",
                  properties: {
                    matches: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          property_id: {
                            type: "string",
                            description: "The UUID of the property",
                          },
                          relevance_reason: {
                            type: "string",
                            description:
                              "Short reason in Portuguese why this property matches the query",
                          },
                        },
                        required: ["property_id", "relevance_reason"],
                        additionalProperties: false,
                      },
                    },
                    parsed_filters: {
                      type: "object",
                      description: "Structured filters extracted from the user's natural language query",
                      properties: {
                        price_min: { type: "number", description: "Minimum price in BRL (null if not specified)" },
                        price_max: { type: "number", description: "Maximum price in BRL (null if not specified)" },
                        bedrooms_min: { type: "number", description: "Minimum number of bedrooms (null if not specified)" },
                        bathrooms_min: { type: "number", description: "Minimum number of bathrooms (null if not specified)" },
                        parking_min: { type: "number", description: "Minimum parking spots (null if not specified)" },
                        area_min: { type: "number", description: "Minimum total area in m² (null if not specified)" },
                        condominium: { type: "string", description: "Condominium name normalized (null if not specified)" },
                        transaction_type: { type: "string", description: "'venda' or 'aluguel' (null if not specified)" },
                        qualitative_terms: {
                          type: "array",
                          items: { type: "string" },
                          description: "Qualitative terms found in the query like 'moderna', 'face norte', 'piso aquecido'",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["matches", "parsed_filters"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "search_properties" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para busca IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ results: [], parsed_filters: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const matches: { property_id: string; relevance_reason: string }[] =
      parsed.matches || [];
    const parsedFilters = parsed.parsed_filters || null;

    const results = matches
      .map((m) => {
        const prop = safeProperties.find((p) => p.id === m.property_id);
        if (!prop) return null;
        return {
          id: prop.id,
          code: prop.code,
          title: prop.title,
          condominium: prop.condominium,
          neighborhood: prop.neighborhood,
          city: prop.city,
          price: prop.price,
          rental_price: prop.rental_price,
          transaction_type: prop.transaction_type,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          area_total: prop.area_total,
          photo: prop.photos?.[0] || null,
          relevance_reason: m.relevance_reason,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ results, parsed_filters: parsedFilters }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-property-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
