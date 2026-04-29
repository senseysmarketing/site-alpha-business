---
name: Search Results Layout
description: Página de resultados da busca usa cards no padrão da home, grade uniforme 3 col com padding lateral
type: feature
---
**Container**: `max-w-7xl mx-auto px-6 md:px-12 lg:px-16` — nunca deixar os cards colados nas bordas do viewport.

**Grid**: uniforme `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8` em `BentoGrid.tsx`. Removido o card "wide" (16/9) — não combina com o card padrão da home.

**Card** (`src/components/search/PropertyCard.tsx`): mesmo visual do `NewArrivalsSection` — `bg-card border border-border/60 rounded-lg shadow-sm`, imagem `aspect-[4/3]` no topo, bloco branco abaixo com meta (transação + código), título (`text-display text-xl`, `min-h-[3.5rem]` para alinhar alturas), localização, specs (área/suítes/vagas), divisor, e footer com preço (BRL, `/mês` quando locação) + botão "Saiba Mais" (`bg-foreground text-background rounded-md`).

**Compare**: checkbox circular fica absoluto no topo direito, fora do `<Link>` (usa `e.preventDefault()` + `e.stopPropagation()`), com fundo glass `bg-background/40 backdrop-blur-sm` para legibilidade sobre qualquer foto.

Skeleton de carregamento usa o mesmo grid (`aspect-[4/5]`, sem item destacado).
