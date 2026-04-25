import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente editorial especializado em imóveis de alto padrão em Alphaville, São Paulo, Brasil.
Seu tom é sofisticado, informativo e orientado a SEO. Sempre responda em português brasileiro.
Foque em termos hiperlocais: Tamboré, Alphaville, Barueri, Santana de Parnaíba, condomínios fechados, mansões, alto padrão.
Siga as melhores práticas de SEO: títulos magnéticos, meta descriptions com CTA, keywords de cauda longa.`;

const ACTION_PROMPTS: Record<string, (content: string) => string> = {
  "generate-titles": (content) =>
    `Com base no rascunho abaixo, gere exatamente 3 títulos magnéticos para um artigo de blog sobre imóveis de luxo em Alphaville. Retorne APENAS os 3 títulos, um por linha, sem numeração.\n\nRascunho:\n${content}`,

  "improve-content": (content) =>
    `Melhore o texto abaixo mantendo a essência, mas aprimorando a fluidez, clareza e engajamento. Mantenha o formato Markdown. Retorne APENAS o texto melhorado.\n\nTexto:\n${content}`,

  "generate-excerpt": (content) =>
    `Crie uma meta description SEO de no máximo 155 caracteres para o artigo abaixo. Inclua um CTA sutil. Retorne APENAS a meta description, sem aspas.\n\nArtigo:\n${content}`,

  "suggest-keywords": (content) =>
    `Analise o conteúdo abaixo e sugira de 6 a 10 palavras-chave SEO hiperlocais relevantes para Alphaville e região. Foque em termos de cauda longa. Retorne APENAS as keywords separadas por vírgula.\n\nConteúdo:\n${content}`,

  "expand-content": (content) =>
    `Expanda o rascunho abaixo em parágrafos completos e bem escritos para um blog de imóveis de luxo. Use Markdown para formatação (## para subtítulos). Retorne APENAS o conteúdo expandido.\n\nRascunho:\n${content}`,

  "generate-full-article": (content) =>
    `Gere um artigo base conciso e estruturado (cerca de 300 a 400 palavras) para um blog de imóveis de luxo em Alphaville, São Paulo. Use Markdown com subtítulos (##) e seja direto ao ponto, otimizado para SEO.\n\nDescrição/Referência:\n${content}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content } = await req.json();

    if (!action || !content) {
      return new Response(JSON.stringify({ error: "action and content are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptFn = ACTION_PROMPTS[action];
    if (!promptFn) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada. Adicione a secret no Supabase para ativar a IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isFullArticle = action === "generate-full-article";

    const requestBody: any = {
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: promptFn(content) },
      ],
    };

    if (isFullArticle) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "create_article",
            description: "Retorna artigo estruturado para o blog.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título SEO" },
                subtitle: { type: "string", description: "Subtítulo curto" },
                content: { type: "string", description: "Markdown 300-400 palavras com ##" },
                excerpt: { type: "string", description: "Meta description, máx 155 chars" },
              },
              required: ["title", "subtitle", "content", "excerpt"],
              additionalProperties: false,
            },
          },
        },
      ];
      requestBody.tool_choice = { type: "function", function: { name: "create_article" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no painel Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    if (isFullArticle) {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const article = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({ result: article }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "IA não retornou o formato esperado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blog-ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
