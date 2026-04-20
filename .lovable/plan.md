

## Refatorar "Lifestyle" — Mesma Estética Editorial

Alinhar `LifestyleSection.tsx` ao novo padrão visual da seção "Nossas Propriedades": header em uma linha, cards brancos sólidos com imagem + bloco de título, e dots de paginação Bordeaux.

### 1. Header — uma linha só
- Remover botões circulares de navegação (ChevronLeft/Right) e o `flex items-end justify-between`.
- Layout novo: `flex items-center justify-between mb-8`
  - Esquerda: `<h2>` em Noto Serif, `text-2xl md:text-3xl font-normal` — texto: `Encontre propriedades que <strong>representam seu estilo de vida</strong>` (parte final em `font-semibold` em vez de italic, conforme o print).
  - Direita: link "Ver todos" → `/busca`, em Inter, `text-sm text-foreground/70 hover:text-primary`.

### 2. Cards de categoria — card branco sólido
Cada slide passa a ter o mesmo wrapper visual da seção anterior:
- Wrapper: `bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`
- **Imagem** (topo): `aspect-[4/3]` (mantida).
- **Bloco inferior** com `p-5`:
  - Título da categoria em Noto Serif, `text-lg md:text-xl font-normal text-foreground` (sem mais ficar fora do card como hoje).

### 3. Carrossel
- Manter Embla com `align: "start"`, `slidesToScroll: 1`, `dragFree: true`.
- Manter `basis-[85%] md:basis-[calc(33.33%-16px)]` — 3 visíveis no desktop, 1 no mobile.
- Gap `gap-6`.

### 4. Dots de paginação (desktop + mobile)
- Mover dots para fora do `md:hidden` — visíveis em todos os breakpoints.
- Mesmo estilo da `NewArrivalsSection`:
  - Container: `flex items-center justify-center gap-2 mt-10`.
  - Ativo: `w-7 h-7 rounded-md bg-primary flex items-center justify-center` com `<span className="w-2 h-2 bg-background rounded-sm" />` interno.
  - Inativo: `w-2 h-2 rounded-full bg-muted-foreground/30`.
- Usar `emblaApi.scrollSnapList()` para refletir o número real de snaps em vez de `categories.length` (mais correto com `containScroll: trimSnaps`).

### 5. Limpeza
- Remover imports não usados após refatoração: `ChevronLeft`, `ChevronRight`.
- Manter integração com `useSiteSettings` e fallback de `defaultCategories` intactos.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/components/LifestyleSection.tsx` (refatoração visual; lógica de dados preservada) |
| Atualizar | `mem://features/lifestyle/layout-content` (refletir novo padrão de card sólido + dots) |

### Observações
- Sem mudanças em tokens globais.
- Padrão de card e dots agora consistente entre "Nossas Propriedades" e "Lifestyle" — base reutilizável para futuras seções de listagem.

