

## Expansion Strip Slider — Seção Lifestyle

Reescrever `src/components/LifestyleSection.tsx` como um acordeão horizontal de 3 faixas verticais.

### Layout Desktop
- 3 `motion.div` lado a lado em um flex row, `h-[85vh]` ou `h-screen`
- Cada faixa usa `flex` com `animate={{ flex: hoveredIndex === i ? 3 : 1 }}` via Framer Motion para expansão elástica
- Transição com `spring` suave (`stiffness: 200, damping: 30`)

### Background e Zoom
- Cada faixa tem `overflow-hidden relative` com imagem `object-cover` absoluta
- No hover da faixa: imagem anima para `scale: 1.05`, senão `scale: 1.0`
- Gradient overlay escuro (`from-black/60 to-transparent`) para legibilidade

### Conteúdo Interno
- **Fechada**: título rotacionado 90° (`rotate: -90, writingMode vertical`) centralizado
- **Expandida**: título gira para horizontal (`rotate: 0`), revela subtitle + botão "Explorar" com `AnimatePresence`
- Botão "Explorar": fundo `bg-bordeaux` texto branco, minimalista

### Título da Seção
- Acima das faixas: "LIFESTYLE" label + "Navegue pelo seu *estilo de vida*" com padding

### Mobile (`useIsMobile`)
- Faixas empilham verticalmente como cards (`h-[300px]` cada)
- Sem hover logic, todos mostram título + subtitle + botão
- Scroll natural

### Estado
- `hoveredIndex: number | null` — controla qual faixa está expandida (default: 0 ou null)

### Arquivo modificado
1. `src/components/LifestyleSection.tsx` — reescrita completa

