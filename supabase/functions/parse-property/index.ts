import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Campo 'text' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em imóveis de alto padrão em Alphaville, São Paulo. 
Extraia dados estruturados da descrição do imóvel fornecida pelo usuário. 
Use a função extract_property_data para retornar os dados.
Se algum dado não for mencionado, omita o campo ou use null.
Para property_type use: casa, apartamento, terreno ou comercial.
Para transaction_type use: venda, locacao ou ambos.`,
          },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_property_data",
              description: "Extrai dados estruturados de um imóvel a partir de uma descrição em texto livre.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título do imóvel" },
                  code: { type: "string", description: "Código do imóvel, ex: ALF-001" },
                  description: { type: "string", description: "Descrição formatada do imóvel" },
                  property_type: { type: "string", enum: ["casa", "apartamento", "terreno", "comercial"] },
                  transaction_type: { type: "string", enum: ["venda", "locacao", "ambos"] },
                  condominium: { type: "string", description: "Nome do condomínio" },
                  address: { type: "string", description: "Endereço do imóvel" },
                  bedrooms: { type: "number", description: "Número de quartos/suítes" },
                  bathrooms: { type: "number", description: "Número de banheiros" },
                  parking_spots: { type: "number", description: "Número de vagas de garagem" },
                  area_total: { type: "number", description: "Área total em m²" },
                  area_built: { type: "number", description: "Área construída em m²" },
                  price: { type: "number", description: "Preço de venda em reais" },
                  rental_price: { type: "number", description: "Preço de locação em reais" },
                  engineering_highlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "Destaques de engenharia e acabamentos",
                  },
                },
                required: ["title"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_property_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(propertyData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-property error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
