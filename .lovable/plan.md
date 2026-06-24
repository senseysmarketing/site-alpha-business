## Objetivo
1. Avançar carrosséis da home por "página inteira" (não 1 card por vez).
2. Padronizar setas de navegação no canto superior direito, alinhadas ao título da seção (ao lado esquerdo do "Ver todos" / "Siga-nos" / link equivalente), apenas com ícones `<` `>` em tamanho médio.

## Mudança 1 — Slide por página
Adicionar `slidesToScroll: "auto"` ao Embla em:
- `src/components/PropertyCarouselSection.tsx`
- `src/components/NewArrivalsSection.tsx` (se também usa Carousel)
- `src/components/InstitutionalSection.tsx` (Redes Sociais)
- `src/components/TeamSection.tsx` (Equipe)

`slidesToScroll: "auto"` respeita o número de cards visíveis no breakpoint atual.

## Mudança 2 — Setas no topo direito
Padrão visual unificado:
- Container do título da seção vira `flex items-center justify-between`.
- Lado direito ganha um cluster: `[< setas >] [link "Ver todos" / "Siga-nos" / etc]`.
- Setas: botões ícone-only (`ChevronLeft` / `ChevronRight` do lucide), tamanho ~40px, `rounded-full`, borda sutil neutra (Greige), hover Bordeaux, `disabled:opacity-40` quando não há mais slides naquela direção.
- Remover as setas atuais flutuantes nas laterais externas (`CarouselPrevious` / `CarouselNext` posicionados absolutos com `-left-12 / -right-12`) nessas seções.

Implementação técnica: usar o padrão Embla `setApi` já existente em `ui/carousel.tsx` para obter a API e renderizar setas customizadas no header. Alternativa equivalente: manter `<CarouselPrevious/Next>` mas reposicioná-los via className para o header — porém usar `setApi` é mais limpo e isola a posição.

Aplicado em:
- `PropertyCarouselSection.tsx` — setas ao lado esquerdo do "Ver todos".
- `NewArrivalsSection.tsx` — mesmo padrão.
- `InstitutionalSection.tsx` (Redes Sociais) — setas ao lado esquerdo do "Siga-nos: @alphaville.sp".
- `TeamSection.tsx` (Equipe) — setas ao lado direito do título (não há link, então só as setas).

Carrosséis fora da home (busca, galeria de imóvel, etc.) ficam inalterados.

## Validação
Preview da home: clicar nas setas avança a página inteira; setas aparecem somente no topo direito alinhadas ao título; setas externas removidas; estado disabled funciona nas extremidades.

## Arquivos
- `src/components/PropertyCarouselSection.tsx`
- `src/components/NewArrivalsSection.tsx`
- `src/components/InstitutionalSection.tsx`
- `src/components/TeamSection.tsx`

Sem alterações em `ui/carousel.tsx`, schema ou backend.
