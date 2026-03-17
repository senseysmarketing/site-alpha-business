

## CMS Editorial (Blog) — Plano de Implementação

Este é um módulo grande. Para manter qualidade e evitar erros, vou dividir em entregas incrementais. A primeira entrega cobre as Fases 1, 2 e 4 (editor, mídia/SEO, preview/publicação). A Fase 3 (AI Sidebar) será uma segunda entrega.

---

### Arquivos a Criar

| Arquivo | Descrição |
|---|---|
| `src/pages/admin/BlogPosts.tsx` | Lista de posts (tabela com status, categoria, data) |
| `src/pages/admin/BlogEditor.tsx` | Editor "Zen Mode" completo |
| `src/components/admin/blog/EditorToolbar.tsx` | Bubble menu flutuante (bold, italic, heading, link, quote) |
| `src/components/admin/blog/MediaSidebar.tsx` | Sidebar lateral com upload, SEO e categorias |
| `src/components/admin/blog/PostPreview.tsx` | Modal de preview que renderiza o post como no site público |

### Arquivos a Editar

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Adicionar rotas `blog` e `blog/novo` e `blog/:id` dentro de `/admin` |

A sidebar já tem o item "Blog" apontando para `/admin/blog`.

---

### Fase 1: Editor "Zen Mode"

**Layout**: Área central limpa (max-w-3xl, mx-auto) com fundo branco puro, sem bordas de card. Tipografia: título em Raleway serifada (text-4xl, font-light), subtítulo em Inter, área de conteúdo em textarea com estilo minimalista (sem borda, font-size 18px, line-height relaxed).

**Bubble Menu**: Componente `EditorToolbar` posicionado com `position: fixed` ou via `window.getSelection()`. Aparece ao selecionar texto. Botões: Bold, Italic, H2, Link, Quote. Como o conteúdo é armazenado como texto simples (com `## ` para headings e `\n\n` como separador de blocos, conforme o BlogPost.tsx renderiza), o toolbar vai inserir marcadores Markdown inline (`**bold**`, `_italic_`, `## heading`).

**Campos**: Título (H1 input sem borda, placeholder "Título do artigo..."), Subtítulo (input menor), Conteúdo (textarea autoexpansível estilo Medium).

---

### Fase 2: Sidebar de Mídia & SEO

**Sidebar direita** (w-80, bg-white, border-l) com seções:

1. **Imagem de Capa**: Dropzone para upload ao bucket `property-photos` (reusando o bucket existente ou criando um `blog-media`). Preview da imagem após upload. Não faremos conversão WebP real no client — simularemos com badge "WebP otimizado".

2. **SEO**: Campo "Meta Descrição" (textarea, max 160 chars com contador). Campo "Slug" auto-gerado a partir do título (slugify), editável.

3. **Categorias**: Radio group com as 4 categorias do enum `blog_category`: Inside Alphaville, Arquitetura & Design, Investimento, Guia de Condomínios.

4. **Configurações**: Toggle "Destaque" (is_featured), Toggle "Exclusivo" (is_exclusive), Campo "Tempo de leitura" (number, auto-calculado por word count).

---

### Fase 4: Preview & Publicação

**Preview**: Botão "Pré-visualizar" abre um Dialog fullscreen que renderiza o post exatamente como o componente `BlogPost.tsx` público (hero com gradiente bordeaux, tipografia, blocos de conteúdo).

**Barra de ações** (sticky bottom):
- **Salvar Rascunho**: Salva com `published_at` = null ou data futura
- **Agendar**: DateTimePicker para definir `published_at` no futuro
- **Publicar**: Define `published_at` = now()

O campo `published_at` da tabela `blog_posts` já existe e será usado para controlar status (rascunho = futuro/null, publicado = passado).

**Nota**: Precisaremos de uma migração para adicionar um campo `status` ao blog_posts (valores: 'rascunho', 'revisao', 'publicado') — OU podemos derivar o status do `published_at` (null = rascunho, futuro = agendado, passado = publicado). Vou usar a abordagem derivada para evitar migração.

---

### Fase 3 (Entrega Futura): AI Sidebar

Será implementada como segunda iteração:
- Sidebar "Alpha AI Assist" com sugestões de keywords hiperlocais
- Botão "Gerar Títulos com IA" (3 opções)
- Botão de microfone Voice-to-Post (simulação visual com ondas sonoras)

---

### Lista de Posts (`BlogPosts.tsx`)

Tabela com colunas: Título, Categoria, Status (badge colorido derivado de published_at), Data, Ações. Botão "Novo Artigo" no topo. Filtros por categoria e status. Segue o padrão visual de `Properties.tsx` (bg-white, shadow-none).

---

### Storage

Criarei um bucket `blog-media` via migração SQL para uploads de imagens de capa.

---

### Resumo de Entregas

1. **BlogPosts.tsx** — Lista/gestão de posts
2. **BlogEditor.tsx** — Editor zen com bubble toolbar
3. **MediaSidebar.tsx** — Upload de capa, SEO, categorias
4. **PostPreview.tsx** — Preview fullscreen estilo site público
5. **Migração** — Bucket `blog-media`
6. **App.tsx** — Rotas novas

