

## Featured Banner — Ajuste de Line-Height do Título

No banner "As propriedades mais que especiais em Alphaville", as linhas do título serif estão muito próximas, fazendo com que ascendentes (l, h, b) encostem nos descendentes da linha de cima.

### Mudança em `src/components/FeaturedPropertySection.tsx`

No `<h2>` do título (Noto Serif, `text-3xl→5xl font-normal`), trocar o line-height atual (provavelmente `leading-tight` ou padrão) por **`leading-[1.15]`** — equilíbrio ideal para serifas grandes em layout editorial.

```tsx
<h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.15] text-white">
  {title}
</h2>
```

### Observações

- Sem alteração de tamanho, peso ou família tipográfica.
- `leading-[1.15]` é mais respirado que `leading-tight` (1.1) e mais compacto que `leading-snug` (1.375) — perfeito para títulos serif de 3 linhas.
- Atualizar `mem://features/featured-property/banner-layout` para registrar o novo line-height.

