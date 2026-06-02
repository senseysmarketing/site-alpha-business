## Mostrar capa nas matérias da /blog

Atualmente o hero e os cards do blog ignoram `cover_image` e mostram apenas gradientes/placeholders bordeaux/cashmere. Vou conectar a imagem real, mantendo fallback para matérias sem capa.

### 1. `src/components/blog/BlogHero.tsx`
- Quando `post.cover_image` existe, renderizar `<img src={post.cover_image}>` como fundo absoluto (`object-cover w-full h-full`).
- Manter o gradiente bordeaux→foreground como fallback quando não houver capa.
- Trocar o overlay atual por um gradiente escuro de baixo para cima (`from-[#0A0A0A]/95 via-[#0A0A0A]/55 to-[#0A0A0A]/15`) para preservar legibilidade do título/subtítulo/meta (mesmo padrão usado em `BlogPost.tsx`).

### 2. `src/components/blog/BlogCard.tsx`
- Quando `post.cover_image` existe, renderizar `<img>` em vez do gradiente cashmere→greige, mantendo o `group-hover:scale-105`, `aspect-[16/10]`/`aspect-[4/3]` e o badge "Exclusivo".
- Sem capa: continuar com o gradiente cashmere→greige atual como placeholder.

### Fora do escopo
- Sem mudanças no schema, hooks, queries ou nos componentes admin/editor.
- `BlogBentoGrid` não muda (só compõe os cards).
- Página `BlogPost` já foi ajustada anteriormente — não será tocada.