

## Carrossel de Cartões Minimalista — Seção Lifestyle

Reescrever `src/components/LifestyleSection.tsx` usando Embla Carousel (já instalado no projeto) em vez do acordeão elástico.

### Layout
- Seção com fundo escuro (`bg-foreground`), título "LIFESTYLE" + "Navegue pelo seu estilo de vida" no topo
- Carrossel Embla com 3 cartões lado a lado, `gap` generoso (~24-32px), sem `overflow-hidden` rígido para que a borda do próximo cartão fique visível
- Cada cartão: `rounded-lg`, imagem de fundo `object-cover`, gradient overlay, conteúdo (count + título + subtitle + botão "Explorar")
- Cartões com altura fixa (~450px desktop, ~350px mobile)

### Navegação
- Setas ultra-finas (`ChevronLeft`/`ChevronRight` de lucide, `strokeWidth: 1`) posicionadas nas extremidades
- Visíveis apenas no hover da seção (`group` + `opacity-0 group-hover:opacity-100 transition-opacity`)
- Desabilitadas quando não pode scrollar

### Indicadores (Dots)
- 3 dots abaixo do carrossel, centralizados
- Dot ativo: `bg-bordeaux`, dots inativos: `bg-white/30`
- Atualizados via `onSelect` do Embla

### Hover nos Cartões
- CSS `transition-transform` com `hover:scale-[1.02]`
- `hover:brightness-110` sutil na imagem

### Responsividade
- Desktop: `basis-[calc(33.33%-16px)]` ou similar, 3 cartões visíveis
- Mobile: `basis-[85%]` para mostrar beirada do próximo cartão, drag livre

### Performance
- Embla com `dragFree: true` para arraste livre
- Sem interferência no scroll vertical (comportamento nativo do Embla)

### Arquivo
- `src/components/LifestyleSection.tsx` — reescrita completa, removendo framer-motion (não necessário), usando Embla via `useEmblaCarousel`

