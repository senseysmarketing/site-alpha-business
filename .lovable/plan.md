

## Fix: Renderização de Markdown no Blog

### Problema

O conteúdo gerado pela IA usa Markdown (`**bold**`, `## heading`, `### heading`, `- lista`, etc.), mas tanto o `BlogPost.tsx` (público) quanto o `PostPreview.tsx` (admin) apenas tratam `## ` como heading e renderizam todo o resto como texto puro — os marcadores `**`, `#`, `*` aparecem literalmente na tela.

### Solução

Criar uma função utilitária `renderMarkdown` que converte Markdown inline para JSX, e um componente `MarkdownBlock` reutilizável. Aplicar em ambos os arquivos de renderização.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/markdown.tsx` | Criar — funções de parsing Markdown para JSX |
| `src/pages/BlogPost.tsx` | Editar — usar o parser no bloco de conteúdo |
| `src/components/admin/blog/PostPreview.tsx` | Editar — usar o mesmo parser |

### Parser (`src/lib/markdown.tsx`)

Exportar uma função `renderMarkdownContent(content: string): ReactNode[]` que:

1. Divide por `\n\n` em blocos
2. Para cada bloco, detecta o tipo:
   - `# ` → H1, `## ` → H2, `### ` → H3
   - `- ` ou `* ` → lista não-ordenada (agrupa itens consecutivos)
   - `1. ` → lista ordenada
   - `> ` → blockquote
   - `---` → hr
   - Parágrafo normal
3. Dentro de cada bloco, processa inline Markdown:
   - `**texto**` → `<strong>`
   - `*texto*` ou `_texto_` → `<em>`
   - `~~texto~~` → `<del>`
   - `` `código` `` → `<code>`
   - `[texto](url)` → `<a>`

### Aplicação

Substituir o loop manual de `contentBlocks.map(...)` em ambos os arquivos pelo componente/função do parser, mantendo as mesmas classes CSS e animações do Framer Motion no BlogPost.tsx.

