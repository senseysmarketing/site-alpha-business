## Diagnóstico
Hoje o título do hero usa breakpoints discretos (`text-3xl md:text-5xl lg:text-6xl`) e a logo idem (`h-8 md:h-11 lg:h-10`). Entre breakpoints (ex: laptop 1366px, tablet 900px, celular grande), os tamanhos "travam" no valor de uma faixa e ficam desproporcionais — exatamente o que aparece nas fotos.

A solução padrão para isso é **tipografia fluida com `clamp()`**, que faz o valor variar continuamente com a largura da viewport, entre um mínimo e um máximo.

## Mudanças

### 1. `src/components/HeroSection.tsx`
Substituir classes discretas por `clamp()` inline:

- **Tagline** (`p` superior): `font-size: clamp(0.625rem, 0.6vw + 0.5rem, 0.75rem)` + letter-spacing proporcional
- **Título h1**: `font-size: clamp(1.75rem, 4.2vw + 0.5rem, 3.75rem)` — escala suave de mobile (~28px) a desktop (~60px), passando por valores intermediários em tablets/laptops
- **Descrição**: `font-size: clamp(0.875rem, 0.4vw + 0.75rem, 1rem)`
- **Botão CTA**: padding também fluido
- **Container**: padding lateral fluido `clamp(1.5rem, 4vw, 6rem)`

Manter `text-display` (Raleway) e `!leading-[1.15]`.

### 2. `src/components/Header.tsx`
Logo fluida:

```tsx
<img className="w-auto" style={{ height: "clamp(1.75rem, 1.4vw + 1.1rem, 2.75rem)" }} />
```

Vai de ~28px (mobile pequeno) até ~44px (desktop largo), sem saltos. Manter `w-auto` para preservar proporção.

### 3. (Opcional, mesmo padrão) Padding vertical do header
`py-[clamp(0.75rem,1.2vw,1.25rem)]` para que a barra acompanhe a altura da logo.

## Fora de escopo
- Não mexer no menu de navegação, mega menu, ou conteúdo dos slides.
- Não tocar em outros heroes (página de imóvel, blog, etc.) — só o `HeroSection` da home e a logo do `Header` global.

## Resultado esperado
- Laptop 13" (1366px) e tablets (768–1024px) param de mostrar o título "estourado" ou a logo desproporcional.
- Mobile pequeno (≤375px) recebe título legível sem quebrar layout.
- Transição visual contínua, sem "pulos" em breakpoints.
