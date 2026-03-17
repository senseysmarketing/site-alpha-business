

## Modal "Gerar Artigo Completo" via AI Assist

Transformar o botão "AI Assist" do top bar para abrir um modal onde o corretor descreve um tema/cola um texto de referência, e a IA gera título, subtítulo, conteúdo completo e excerpt de uma só vez.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/admin/blog/AIGenerateModal.tsx` | Criar — modal com textarea para prompt + botão gerar |
| `src/pages/admin/BlogEditor.tsx` | Editar — trocar onClick do botão AI Assist para abrir o modal, importar novo componente |
| `supabase/functions/blog-ai-assist/index.ts` | Editar — adicionar action `generate-full-article` |

### Modal (`AIGenerateModal.tsx`)

- Dialog com título "Gerar Artigo com IA"
- Textarea grande: placeholder "Descreva o tema do artigo, cole um texto de referência ou dê instruções para a IA..."
- Botão "Gerar Artigo" com loading spinner
- Chama `supabase.functions.invoke("blog-ai-assist", { body: { action: "generate-full-article", content: promptText } })`
- Resposta da IA retorna JSON estruturado (via tool calling) com `{ title, subtitle, content, excerpt }`
- Ao receber, preenche todos os campos do editor de uma vez e fecha o modal
- Toast de confirmação "Artigo gerado com sucesso!"

### Edge Function — nova action `generate-full-article`

Adicionar ao `ACTION_PROMPTS` uma action que pede à IA para gerar um artigo completo. Usar **tool calling** para garantir output estruturado:

```
tools: [{
  type: "function",
  function: {
    name: "create_article",
    parameters: {
      title: string,
      subtitle: string, 
      content: string (Markdown),
      excerpt: string (max 155 chars)
    }
  }
}]
```

Prompt: "Com base na descrição/referência abaixo, gere um artigo completo para blog de imóveis de luxo em Alphaville..."

### BlogEditor.tsx

- Importar `AIGenerateModal`
- Adicionar estado `generateModalOpen`
- Botão "AI Assist" no top bar → `setGenerateModalOpen(true)`
- Callback `onGenerated` recebe `{ title, subtitle, content, excerpt }` e aplica via `setTitle`, `setSubtitle`, `setContent`, `setExcerpt`

