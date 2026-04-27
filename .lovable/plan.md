Plano aprovado para execução assim que sair do modo somente leitura:

1. Atualizar o modelo Gemini nas duas Edge Functions
   - Em `supabase/functions/blog-ai-assist/index.ts`, trocar:
     ```ts
     model: "gemini-1.5-flash-latest"
     ```
     por:
     ```ts
     model: "gemini-2.5-flash"
     ```
   - Em `supabase/functions/parse-property/index.ts`, aplicar a mesma troca.

2. Preservar o restante da implementação
   - Manter o endpoint OpenAI-compatible:
     `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
   - Manter `tools` / `tool_choice` como estão.
   - Manter os retornos com `corsHeaders` intactos.
   - Manter o tratamento específico de 401/403/429.
   - Manter o retry de 429 existente em `blog-ai-assist`.

3. Deploy
   - Re-deployar `blog-ai-assist` e `parse-property` no Supabase.
   - Depois do deploy, testar novamente a geração no blog e/ou o preenchimento com IA.

Observação técnica: confirmei que o erro atual ainda vem do modelo `gemini-1.5-flash-latest` nas functions, então a correção é somente a troca do identificador do modelo para `gemini-2.5-flash`.