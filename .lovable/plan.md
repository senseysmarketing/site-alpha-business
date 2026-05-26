## Objetivo
Adicionar setas de navegação laterais idênticas às da seção "Redes Sociais" (componente shadcn `CarouselPrevious`/`CarouselNext`) em todos os carrosséis de imóveis da home.

## Arquivos
- `src/components/NewArrivalsSection.tsx`
- `src/components/PropertyCarouselSection.tsx`

## Contexto
Ambos os componentes usam `useEmblaCarousel` direto (não o wrapper `Carousel` do shadcn). Para manter o mesmo visual das setas usadas em "Redes Sociais" sem reescrever toda a estrutura (que tem cards, dots e queries específicas), vou **replicar visualmente** os botões usando o mesmo `Button` outline + ícones `ArrowLeft`/`ArrowRight` do lucide, com as classes exatas do `CarouselPrevious`/`CarouselNext` do shadcn (`h-8 w-8 rounded-full`, posicionados absolutamente nas bordas, `hidden md:flex`).

## Mudanças (idênticas nos dois arquivos)
1. Importar `Button` (`@/components/ui/button`) e `ArrowLeft`, `ArrowRight` de `lucide-react`.
2. Adicionar estados `canScrollPrev` / `canScrollNext` no mesmo `useEffect` que já escuta `select`/`reInit` do Embla, atualizados via `emblaApi.canScrollPrev()` / `canScrollNext()`.
3. Envolver o container `.overflow-hidden` em uma `div` `relative` para ancorar as setas.
4. Renderizar dois botões absolutos `hidden md:flex` no mesmo padrão visual da seção Redes Sociais (`-left-4` e `-right-4`, `top-1/2 -translate-y-1/2`, `h-8 w-8 rounded-full`, `variant="outline"`, `disabled={!canScrollPrev/Next}`), chamando `emblaApi?.scrollPrev()` / `scrollNext()`.
5. Mantém os dots no rodapé como já estão.

## Fora do escopo
- Não alterar o wrapper Embla nem o layout dos cards.
- Não tocar nos outros carrosséis (Hero, Team, Lifestyle) — apenas os de imóveis citados.