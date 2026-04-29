---
name: Search Results Layout
description: Página /busca com hero igual ao da home (toggle Cognitivo/Tradicional), cards no padrão home e grade uniforme com padding lateral
type: feature
---
**Hero (`SearchHero.tsx`)**: replica o padrão da home — cartão `bg-background rounded-lg shadow-xl p-4 md:p-6` dentro de `max-w-3xl`, com toggle pill `Cognitivo / Busca tradicional` (`bg-muted rounded-full`). Modo Cognitivo: input com mic + ícone Search + botão Buscar inline + chips de `parsed_filters` + pills de lifestyle abaixo. Modo Tradicional: grid `grid-cols-2 md:grid-cols-3 gap-3` com Transação/Tipo/Quartos/Preço mín/Até/Condomínio; estado inicial lê `condominium` e `transactionType` do `searchParams`; submit grava de volta na URL via `setSearchParams` e chama `handleSearch` (ou limpa results para o fallback de lista completa quando não há termos). Pills só aparecem no modo Cognitivo e voltam para Cognitivo quando clicadas.
**Container**: `max-w-7xl mx-auto px-6 md:px-12 lg:px-16` — nunca deixar os cards colados nas bordas do viewport.

**Grid**: uniforme `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8` em `BentoGrid.tsx`. Removido o card "wide" (16/9) — não combina com o card padrão da home.

**Card** (`src/components/search/PropertyCard.tsx`): mesmo visual do `NewArrivalsSection` — `bg-card border border-border/60 rounded-lg shadow-sm`, imagem `aspect-[4/3]` no topo, bloco branco abaixo com meta (transação + código), título (`text-display text-xl`, `min-h-[3.5rem]` para alinhar alturas), localização, specs (área/suítes/vagas), divisor, e footer com preço (BRL, `/mês` quando locação) + botão "Saiba Mais" (`bg-foreground text-background rounded-md`).

**Compare**: checkbox circular fica absoluto no topo direito, fora do `<Link>` (usa `e.preventDefault()` + `e.stopPropagation()`), com fundo glass `bg-background/40 backdrop-blur-sm` para legibilidade sobre qualquer foto.

Skeleton de carregamento usa o mesmo grid (`aspect-[4/5]`, sem item destacado).
