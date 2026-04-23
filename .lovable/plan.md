

## Gerenciamento de Categorias do Blog

Hoje as categorias do blog são um **enum Postgres fixo** (`blog_category`) com 4 valores hardcoded em vários arquivos. Para permitir CRUD pelo admin, vamos converter para uma **tabela dinâmica** e adicionar carrossel deslizante nos filtros.

### 1. Migração de banco (Supabase)

Criar tabela `blog_categories`:

| Coluna | Tipo | Detalhes |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `slug` | text | UNIQUE, NOT NULL (ex: `inside-alphaville`) |
| `label` | text | NOT NULL (ex: `Inside Alphaville`) |
| `sort_order` | int | default 0 |
| `created_at` | timestamptz | default now() |

**RLS**:
- SELECT público (igual `blog_posts`)
- INSERT/UPDATE/DELETE: apenas admin via `has_role(auth.uid(), 'admin')`

**Migração de dados**: seed com os 4 valores existentes (`inside-alphaville`, `arquitetura-design`, `investimento`, `guia-condominios`) preservando os slugs — assim os `blog_posts.category` (text/enum) continuam funcionando sem renomear nada.

**Coluna `blog_posts.category`**: alterar de `enum blog_category` para `text` (mantém os mesmos valores). Isso libera novos slugs sem precisar alterar enum no Postgres a cada categoria criada. Sem perda de dados.

### 2. Nova tela: `/admin/blog/categorias`

Acessível via botão **"Categorias"** ao lado de "+ Novo Artigo" no header de `/admin/blog`.

Layout simples (estética Quiet Luxury já existente):
- Lista em tabela: Label, Slug, Nº de artigos vinculados, Ações (Editar / Excluir).
- Botão **"+ Nova Categoria"** abre dialog com campos: Label (input), Slug (auto-gerado a partir do label, editável).
- Editar: mesmo dialog em modo edição.
- Excluir: bloqueado se houver artigos vinculados (mostra toast: "X artigos usam esta categoria. Reatribua antes de excluir.").

Apenas admins veem a página/botão (via `useAuth` + `ProtectedRoute allowedRoles={["admin"]}`).

### 3. Hook `useBlogCategories`

Centraliza fetch + cache local das categorias. Usado por:
- `BlogPosts.tsx` (filtros admin)
- `BlogEditor.tsx` / `MediaSidebar.tsx` (seleção de categoria no editor)
- `Blog.tsx` (filtros públicos)
- `BlogCard.tsx` / `BlogHero.tsx` / `PostPreview.tsx` (label de exibição)

Substitui todos os `categoryLabels` hardcoded por lookup dinâmico (fallback: usa o próprio slug se não encontrar).

### 4. Carrossel deslizante nos filtros de categoria (`BlogPosts.tsx`)

Container atual quebra layout quando há muitas categorias. Mudanças:

- Wrapper `flex-1 overflow-hidden` com **largura limitada até a divisória `|` antes de "Status"** (usa `min-w-0` + `flex-1`).
- Dentro: `div` com `overflow-x-auto scrollbar-hide` e os chips de categoria em linha (`flex gap-1.5 whitespace-nowrap`).
- Setas **chevron-left/chevron-right** (lucide) aparecem apenas quando há overflow, posicionadas absolutamente nas bordas com gradiente fade branco para indicar conteúdo cortado. Clique scrolla `~200px`.
- Detecção de overflow via `useRef` + `ResizeObserver` no container interno.
- Divisória `|` e bloco "Status" permanecem fixos à direita, fora do carrossel.

Mesmo tratamento aplicado no filtro de categorias da página pública `Blog.tsx` para consistência.

### 5. Arquivos editados/criados

- **Migração SQL** (nova tabela + alteração da coluna + seed)
- `src/hooks/useBlogCategories.ts` (novo)
- `src/pages/admin/BlogCategories.tsx` (nova tela)
- `src/components/admin/blog/CategoryDialog.tsx` (novo, criar/editar)
- `src/App.tsx` (rota `/admin/blog/categorias` protegida para admin)
- `src/components/admin/AdminSidebar.tsx` (item de menu opcional, ou só botão na tela Blog)
- `src/pages/admin/BlogPosts.tsx` (filtros dinâmicos + carrossel + botão "Categorias")
- `src/pages/admin/BlogEditor.tsx` (passa categorias dinâmicas)
- `src/components/admin/blog/MediaSidebar.tsx` (RadioGroup dinâmico)
- `src/components/admin/blog/PostPreview.tsx` (label dinâmico)
- `src/pages/Blog.tsx` (filtros públicos dinâmicos + carrossel)
- `src/components/blog/BlogCard.tsx` + `BlogHero.tsx` (label dinâmico)
- `mem://features/admin/blog-cms` (registrar gestão de categorias)

### Observação

Como `blog_posts.category` deixa de ser enum e vira `text` referenciando o slug da nova tabela (sem FK rígida, para manter flexibilidade no rename), o `types.ts` regenerado pelo Supabase refletirá a mudança automaticamente. Nenhum artigo existente é afetado.

