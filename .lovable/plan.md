

## Cinematic Background Slider — Seção Lifestyle

Substituir o scroll horizontal por um slider fullscreen estilo Apple TV com transições cinematográficas.

### Mudanças em `src/components/LifestyleSection.tsx`

Reescrever completamente o componente:

**Estado e refs:**
- `activeIndex` (useState) — categoria ativa (0, 1, 2)
- `mousePosition` (useRef + mousemove listener) — para parallax do mouse

**Layout:**
- Seção com `h-screen` (sem sticky/scroll hijack), `relative overflow-hidden`
- Background: todas as 3 imagens renderizadas com `position absolute inset-0`, controladas por `AnimatePresence`
  - Imagem ativa: anima de `scale: 1.1, opacity: 0` → `scale: 1.0, opacity: 1` (zoom-out reveal)
  - Imagem saindo: fade out
  - Parallax no mouse: `transform: translate(offsetX, offsetY)` calculado pelo mousemove (±10px max)
- Gradient overlay escuro na parte inferior para legibilidade

**Conteúdo sobreposto:**
- Canto superior esquerdo: "LIFESTYLE" label + título "Navegue pelo seu *estilo de vida*"
- Centro/inferior: texto descritivo da categoria ativa (count + subtitle) com AnimatePresence fade+scale
- Barra de navegação: 3 botões minimalistas (títulos das categorias) dispostos horizontalmente na parte inferior
  - Botão ativo: texto branco com underline ou dot indicator
  - Botões inativos: texto branco/70, hover branco
  - Ao clicar, muda `activeIndex`

**Performance:**
- Todas as imagens pré-carregadas (sem lazy load)
- Transições via framer-motion `AnimatePresence` com `mode="wait"` ou `mode="popLayout"`
- Parallax via `onMouseMove` com `requestAnimationFrame` ou direto no state (leve com 3 imagens)
- Sem scroll hijack — seção ocupa viewport normal

**Mobile:**
- Mesma mecânica, botões empilhados ou menores
- Parallax desativado no mobile

