

## Resultados de Busca — Hero Limpo + Tipografia Padronizada

Três ajustes na página `/busca` para alinhá-la ao padrão visual da home.

### 1. Hero (`src/components/search/SearchHero.tsx`)

- **Remover vídeo de fundo** (`<video src="/videos/hero-bg.mp4">`) e o `<div>` do degradê escuro.
- **Fundo claro**: trocar por `bg-background` (off-white #F8F8F8 do design system).
- **Altura menor**: reduzir `h-[40vh] min-h-[320px]` → `h-auto py-12 md:py-16` para diminuir o espaçamento até a barra de pesquisa e até os resultados.
- **Título "Alpha Concierge"**: trocar `text-primary-foreground` (branco) → `text-foreground` (Bordeaux/escuro). Manter `text-display` (Noto Serif).
- **Pílulas Lifestyle** (Gourmet Assinado / Automação / VGV Exclusivo): estavam com `text-primary-foreground/70` + `border-primary-foreground/20` (claras sobre fundo escuro). Trocar para tons cinza neutros sobre fundo claro:
  - Texto: `text-muted-foreground hover:text-foreground`
  - Borda: `border-border hover:border-muted-foreground/40`
  - Fundo: `bg-muted/40 hover:bg-muted` (cinza claro, fácil de visualizar conforme pediu)
- **Glass-panel da busca**: a classe `glass-panel` já fica visível em fundo claro; nenhuma mudança ali.

### 2. Tipografia padronizada (`src/components/search/PropertyCard.tsx`)

Alinhar com a home (LifestyleSection / FeaturedProperty usam `text-display` para títulos serif e `text-body` para corpo — já é o padrão). Ajustes pontuais:

- Título do card: hoje `text-display text-lg md:text-xl font-normal` — manter, mas garantir consistência com cards da home subindo para `text-display text-xl md:text-2xl font-normal` no card wide (banner) para hierarquia mais clara, mantendo `text-lg md:text-xl` nos cards da grade.
- Corpo (localização, specs, preço): já usa `text-body` — ok.
- Code badge: já `text-body text-[10px] tracking-[0.2em] uppercase` — ok.

### 3. Espaçamento até resultados (`src/pages/SearchResults.tsx`)

- Trocar `<section className="section-padding">` → `<section className="pt-6 md:pt-8 pb-16 md:pb-24">` para aproximar os resultados da barra de busca (a `section-padding` adiciona ~6rem topo).
- Reduzir `mb-8` da toolbar → `mb-6`.

### Resultado

- Hero leve, fundo off-white, sem vídeo nem degradê preto.
- Pílulas em cinza neutro, legíveis sobre o fundo claro.
- Tipografia idêntica ao restante do site (Noto Serif para títulos, Inter para corpo, via tokens `text-display`/`text-body`).
- Resultados começam ~80px mais perto da busca.

### Arquivos editados

- `src/components/search/SearchHero.tsx`
- `src/pages/SearchResults.tsx`
- `src/components/search/PropertyCard.tsx` (ajuste pontual de hierarquia)

