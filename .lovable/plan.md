

## Tipografia — Títulos em Noto Serif

Substituir a fonte de títulos atual (Raleway, sans-serif) por **Noto Serif**, com pesos Light (300), Regular (400), Medium (500), SemiBold (600) e variantes itálicas. Foco principal: títulos do Hero e demais headings do site.

### Reavaliação da regra anterior
- A diretriz "NEVER use serif" da memória será **revogada para títulos**, mantendo Inter (sans-serif) para corpo/UI.
- Noto Serif traz peso editorial coerente com a estética "Quiet Luxury" e o tom italic já usado no Hero.

### 1. Importação da fonte (`src/index.css`)
- Substituir o `@import` do Google Fonts:
  - **Antes**: `Cormorant Garamond + Raleway + Inter + Roboto`
  - **Depois**: `Noto Serif (300, 400, 500, 600 + ital) + Inter (300, 400, 500, 600) + Roboto (mantido para casos pontuais)`
- Atualizar a variável `--font-display`:
  - **Antes**: `'Raleway', sans-serif`
  - **Depois**: `'Noto Serif', serif`
- `--font-body` permanece `'Inter', sans-serif`.
- Classe utilitária `.text-serif` (hoje aponta para Cormorant Garamond) passa a apontar para `'Noto Serif', serif` — consolidando uma única família serifada no projeto.

### 2. Tailwind (`tailwind.config.ts`)
- Atualizar `fontFamily.display` de `["Raleway", "sans-serif"]` para `["Noto Serif", "serif"]`.
- `fontFamily.body` permanece `["Inter", "sans-serif"]`.
- Todos os componentes que usam `font-display` ou as tags `h1–h6` (que herdam `var(--font-display)` via `src/index.css @layer base`) passam a renderizar em Noto Serif automaticamente.

### 3. Hero (`src/components/HeroSection.tsx`)
- O `<h1>` do slide já usa `text-display ... italic` — vai herdar Noto Serif Italic naturalmente.
- Ajuste fino: trocar `font-light` por `font-normal` no h1 para dar mais presença à serifa (Noto Serif fica fraca demais em 300 sobre imagem).
- Tagline (`text-xs uppercase tracking-[0.3em]`) permanece em Inter (sans-serif) — é label de UI, não título.
- CTA "Saiba Mais" permanece em Inter — é botão.

### 4. Escopo automático (sem edição arquivo a arquivo)
Herdam Noto Serif via tokens:
- Headings de todas as seções da home (Featured, Lifestyle, Alphaville, Private Collection, Team, Contact, Footer).
- Títulos das páginas Blog, BlogPost, PropertyDetail, SearchResults.
- Títulos do painel admin (Dashboard, CRM, Properties, Reports, etc.).
- Modais e dialogs (DialogTitle do shadcn usa font-display indiretamente onde aplicável; demais ficam em Inter, o que é o comportamento desejado para UI).

### 5. Memória / diretrizes
- Atualizar `mem://index.md` (Core):
  - **Antes**: "Raleway for headings, Inter for body/support. NEVER use serif."
  - **Depois**: "Noto Serif (300/400/500/600 + italic) para títulos e headings. Inter para corpo, UI e labels. Cormorant Garamond removido."
- Atualizar `mem://style/visual-identity` com a nova stack tipográfica.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/index.css` (import + `--font-display` + `.text-serif`) |
| Editar | `tailwind.config.ts` (`fontFamily.display`) |
| Editar | `src/components/HeroSection.tsx` (peso do h1) |
| Editar | `mem://index.md` (regra de tipografia) |
| Editar | `mem://style/visual-identity` (stack tipográfica) |

### Observações
- Nenhuma necessidade de tocar componentes individuais — a herança via `h1–h6` + `font-display` cobre o site inteiro.
- Cormorant Garamond é descontinuado do projeto (não está em uso ativo significativo).
- Roboto permanece importado caso algum componente legado dependa, mas pode ser removido em refinamento futuro.

