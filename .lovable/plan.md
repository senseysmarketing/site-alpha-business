

## Hero + Banner — Espaçamento entre Linhas dos Títulos

Aumentar o `line-height` dos dois títulos serifados para dar respiro vertical adequado e evitar que descendentes ("p", "g") encostem nos ascendentes da linha seguinte.

### 1. Hero (`src/components/HeroSection.tsx`, linha 190)

Atual:
```
className="text-display ... leading-tight"
```
(`leading-tight` = 1.1 — muito apertado para serif grande)

Novo:
```
className="text-display ... leading-[1.35]"
```

### 2. Featured Banner (`src/components/FeaturedPropertySection.tsx`, ~linha 56)

Atual:
```
className="text-display ... leading-[1.25] mb-6 max-w-md"
```

Novo:
```
className="text-display ... leading-[1.35] mb-6 max-w-md"
```

### Por que `1.35`

- `1.1` (atual hero) é apropriado para sans-serif compacto, não para Noto Serif display.
- `1.25` (atual banner) ainda deixa descendentes próximos das letras maiúsculas da linha seguinte.
- `1.35` é o valor canônico para títulos serifados editoriais (mesma faixa usada por NYT, Bon Appétit) — abre o respiro sem fazer o título "desmontar" em linhas isoladas.

### Arquivos editados

- `src/components/HeroSection.tsx`
- `src/components/FeaturedPropertySection.tsx`

