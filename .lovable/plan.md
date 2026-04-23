

## Ocultar artigos despublicados do site público

Hoje as queries públicas (`/blog` e `/blog/:slug`) trazem **todos** os posts independente da data. Após implementar o "Despublicar" (que seta `published_at` para `2099-01-01`), esses posts continuariam aparecendo no site se nada for ajustado.

### Correção

Adicionar filtro `.lte("published_at", new Date().toISOString())` em duas queries públicas:

**1. `src/pages/Blog.tsx`** (listagem do blog)
```ts
.from("blog_posts")
.select("*")
.lte("published_at", new Date().toISOString())  // novo
.order("published_at", { ascending: false });
```

**2. `src/pages/BlogPost.tsx`** (página individual do artigo)
Adicionar o mesmo `.lte("published_at", new Date().toISOString())` na query por slug. Se o post estiver despublicado/agendado, retorna vazio → mostra 404 (`NotFound`), comportamento desejado mesmo se alguém tiver o link direto.

### Resumo do comportamento final

| Status | published_at | Aparece em /blog | Acessível por /blog/:slug |
|---|---|---|---|
| Publicado | passado | ✅ | ✅ |
| Agendado | futuro próximo | ❌ (até a data chegar) | ❌ (404) |
| Despublicado | 2099-01-01 | ❌ | ❌ (404) |
| Rascunho | 2099-01-01 | ❌ | ❌ (404) |

No painel admin (`/admin/blog`), todos continuam visíveis com seu badge de status — sem mudanças.

### Plano combinado com a mensagem anterior (botão Despublicar/Excluir)

Esta correção será aplicada **junto** com a implementação do botão contextual no `BlogEditor.tsx` que já foi aprovada antes.

### Arquivos editados

- `src/pages/admin/BlogEditor.tsx` (botão Despublicar/Excluir + AlertDialog — plano anterior)
- `src/pages/Blog.tsx` (filtro `published_at <= now()`)
- `src/pages/BlogPost.tsx` (filtro `published_at <= now()`)

