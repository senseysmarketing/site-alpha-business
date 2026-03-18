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
      return new Response(JSON.stringify({ results: [] }), {
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

    // Fetch all active properties with rich data
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

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build property context for AI
    const propertyContext = properties.map((p) => {
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

    const systemPrompt = `Você é um assistente imobiliário especializado em Alphaville e região. Você tem acesso a uma lista de imóveis disponíveis. Sua tarefa é analisar a busca do usuário e retornar os imóveis mais relevantes.

IMÓVEIS DISPONÍVEIS:
${propertyContext}

REGRAS:
- Retorne no máximo 6 imóveis mais relevantes
- Se a busca for por código (ex: "AB001"), busque exatamente esse código
- Se for busca por região/condomínio, filtre por localização
- Se for busca por características (quartos, preço, área), filtre adequadamente
- Se for uma busca em linguagem natural, interprete a intenção e encontre os melhores matches
- Sempre forneça uma razão curta de por que cada imóvel é relevante para a busca`;

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
                  "Return the most relevant properties matching the user query.",
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
                  },
                  required: ["matches"],
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
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const matches: { property_id: string; relevance_reason: string }[] =
      parsed.matches || [];

    // Enrich matches with property data
    const results = matches
      .map((m) => {
        const prop = properties.find((p) => p.id === m.property_id);
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

    return new Response(JSON.stringify({ results }), {
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
