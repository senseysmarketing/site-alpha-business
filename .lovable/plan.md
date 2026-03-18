

## Pagina de Resultados de Busca — Magazine Style (Sem Mapa)

### Visao Geral

Nova rota `/busca` com layout editorial de revista digital de luxo. Hero cinematic com zoom-out, busca AI com voz, grid Bento Box, cards 4/5 com hover effects, GSAP staggered animations, Lenis smooth scroll, filtros avancados em Drawer, e comparador visual.

### Dependencias

- `gsap` — staggered fade-in animations
- `lenis` — smooth scroll Apple-style
- Cormorant Garamond ja importada no CSS (`text-serif`)

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/SearchResults.tsx` | **Criar** — Pagina principal: hero cinematic + barra busca AI + grid editorial + comparador |
| `src/components/search/SearchHero.tsx` | **Criar** — Hero full-bleed (40vh) com video/imagem + zoom-out GSAP + barra busca centralizada + pills de lifestyle |
| `src/components/search/PropertyCard.tsx` | **Criar** — Card 4/5, hover zoom, overlay specs com icones thin-line, titulo serif, dados mono |
| `src/components/search/BentoGrid.tsx` | **Criar** — Grid dinamico alternando cards full-width (imoveis icone/featured) e cards 2-3 colunas |
| `src/components/search/AdvancedFiltersDrawer.tsx` | **Criar** — Drawer lateral com filtros avancados (preco range, suites, condominio, tipo) |
| `src/components/search/CompareModal.tsx` | **Criar** — Modal editorial lado a lado para comparar 2 imoveis |
| `src/components/search/ConciergeSidebar.tsx` | **Criar** — Widget flutuante "Baseado na sua navegacao..." com 3 sugestoes |
| `src/components/SearchResultsPanel.tsx` | **Editar** — Adicionar botao "Ver todos os resultados" que navega para `/busca?q=...` |
| `src/App.tsx` | **Editar** — Adicionar rota `/busca` |
| `src/index.css` | **Editar** — Adicionar classe `.font-mono-specs` para dados tecnicos |

### Detalhes por Componente

**SearchHero** (40vh):
- Video ou imagem full-bleed como background
- GSAP `scale(1.1) → scale(1)` zoom-out no load (2s ease-out)
- Overlay gradient escuro
- Barra de busca centralizada reutilizando logica AI search + voz (Web Speech API) do HeroSection
- Mic pulsante em bordeaux com `motion.div` ring animation
- Pills abaixo: "Gourmet Assinado", "Automacao", "VGV Exclusivo" — clicam e preenchem a busca

**BentoGrid**:
- Primeiro resultado (ou featured): card full-width (col-span-full, aspect 16/9)
- Proximos 2-3: lado a lado (2 ou 3 colunas)
- Repete padrao alternando
- GSAP `ScrollTrigger` com staggered fade-in (y: 40 → 0, opacity: 0 → 1, stagger: 0.15s)
- Lenis inicializado no mount da pagina para smooth scroll

**PropertyCard** (aspect 4/5):
- `rounded-xl` (12px)
- Imagem cover com `group-hover:scale-105` (300ms)
- Hover overlay: gradient bottom-up com icones thin-line (Maximize, Bed, Car) + valores em `font-mono text-xs`
- Titulo em `text-serif` (Cormorant Garamond)
- Preco e localizacao em `font-body` (Inter)
- Checkbox discreto no canto para selecionar para comparacao

**AdvancedFiltersDrawer**:
- Usa componente `Sheet` existente (lado direito)
- Sliders para preco min/max
- Select para condominio, tipo de imovel, transaction type
- Checkboxes para numero de suites
- Botao "Aplicar Filtros" que filtra client-side os resultados da AI

**CompareModal**:
- Dialog fullscreen com 2 colunas
- Foto grande no topo de cada
- Ficha tecnica pareada (preco, area, quartos, vagas, condominio)
- Botao flutuante "Comparar (2)" aparece quando 2 cards selecionados

**ConciergeSidebar**:
- Desktop: widget fixo no canto inferior direito, glass-panel
- Mostra 3 imoveis recomendados baseados na query atual (pega dos resultados AI)
- Texto: "Baseado na sua busca, selecionamos estas mansoes exclusivas"
- Mobile: bottom sheet discreto

**SearchResultsPanel (editar)**:
- Apos a lista de resultados, adicionar botao "Ver todos os resultados →"
- `onClick`: `navigate(\`/busca?q=\${encodeURIComponent(query)}\`)`
- Passa a query via URL search params

**Fluxo**:
1. Usuario busca no Hero da home → dropdown mostra ate 6 resultados + "Ver todos"
2. Clica "Ver todos" → `/busca?q=...`
3. Pagina `/busca` le `q` da URL, dispara busca AI automaticamente
4. Hero cinematic com zoom-out + barra busca pre-preenchida
5. Resultados em grid Bento com cards staggered
6. Filtros avancados via botao "Filtros" → abre Drawer
7. Seleciona 2 cards → botao "Comparar" → modal editorial

### Mobile
- Grid vira 1 coluna (cards full-width)
- Comparador: modal empilhado (scroll vertical)
- Concierge: bottom sheet
- Pills em horizontal scroll

