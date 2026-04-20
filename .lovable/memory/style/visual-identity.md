---
name: Visual Identity
description: Complete design tokens, brand colors, typography and shape rules
type: design
---

## Brand Colors
- Background: Off-white #F8F8F8 (`--background: 30 33% 96%`)
- Neutrals: Cashmere, Greige
- Accent: Midnight Bordeaux #2A070C (`--bordeaux`)

## Typography
- **Headings (h1–h6, `font-display`, `.text-display`, `.text-serif`)**: **Noto Serif** — pesos 300, 400, 500, 600 + variantes itálicas. Italic é o tom editorial padrão para headlines de hero/seção.
- **Body, UI, labels, botões (`font-body`)**: Inter — pesos 300, 400, 500, 600.
- **Removidos**: Cormorant Garamond e Raleway (descontinuados).
- Regra: nenhuma outra família serifada deve ser introduzida. `text-serif` aponta para Noto Serif (família única).

## Shapes
- `--radius: 0.75rem` (token padrão; propaga via shadcn).
- Botões pill e controles de mídia: `rounded-full`.
- Aplica-se ao site público e ao painel admin.
