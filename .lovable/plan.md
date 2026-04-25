# Otimização de Custos de IA — Migração para Google Gemini Direto

## Tarefa 1 — Migrar Edge Functions para a API direta do Gemini

Aplicar as mesmas alterações em **`supabase/functions/blog-ai-assist/index.ts`** e **`supabase/functions/parse-property/index.ts`**:

1. **Trocar a variável de ambiente**:
   - De: `Deno.env.get("LOVABLE_API_KEY")`
   - Para: `Deno.env.get("GEMINI_API_KEY")`

2. **Trocar a URL do endpoint** (mantendo formato OpenAI-compatible):
   - De: `https://ai.gateway.lovable.dev/v1/chat/completions`
   - Para: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`

3. **Trocar o modelo**:
   - De: `google/gemini-3-flash-preview`
   - Para: `gemini-2.0-flash`

4. **Fallback amigável** caso a secret não esteja configurada (com CORS intacto):
```ts
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  return new Response(
    JSON.stringify({ error: "GEMINI_API_KEY não configurada. Adicione a secret no Supabase para ativar a IA." }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

5. **Manter CORS** (`...corsHeaders`) em **todos** os retornos de erro (429, 402, 500, validação) — sem alterações na lógica de tools/tool_choice/streaming, pois o endpoint OpenAI-compatible do Gemini suporta function calling.

## Tarefa 2 — Reduzir tokens no gerador de artigos

Em **`supabase/functions/blog-ai-assist/index.ts`**, dentro de `ACTION_PROMPTS["generate-full-article"]`:

- **Remover**: "O artigo deve ter pelo menos 800 palavras"
- **Substituir por**: "Gere um artigo base conciso e estruturado (cerca de 300 a 400 palavras) para um blog de imóveis de luxo em Alphaville, São Paulo. Use Markdown com subtítulos (##) e seja direto ao ponto, otimizado para SEO."
- **Bônus**: encurtar também as `description` dos campos do tool schema `create_article` para reduzir input tokens.

## Tarefa 3 — Isolamento do parse-property

✅ Já confirmado em revisão: a função é chamada apenas manualmente em `src/pages/admin/PropertyForm.tsx` (handler `handleAiProcess` do botão "Preencher com IA"). Não está em loops de importação em massa nem em `sync-kenlo-properties`. **Nenhuma alteração necessária.**

## Próximos Passos do Usuário

Após o deploy, o usuário deve:
1. Gerar a chave gratuita em https://aistudio.google.com/app/apikey
2. Adicionar como secret `GEMINI_API_KEY` nas Edge Function Secrets do Supabase

## Arquivos modificados
- `supabase/functions/blog-ai-assist/index.ts`
- `supabase/functions/parse-property/index.ts`
