---
name: Visual Identity
description: Complete design tokens, brand colors, typography and shape rules
type: design
---

## Brand Colors (DEFAULTS — overridable via Admin)
- Background: Off-white #F8F8F8 (`--background: 30 33% 96%`)
- Neutrals: Cashmere, Greige
- Accent: Midnight Bordeaux #2A070C (`--bordeaux`)

## Dynamic Theming
As cores reais do site são controladas via `site_settings.design_tokens` (Admin → Identidade → Design System) e injetadas em `:root` pelo `ThemeProvider` (`src/components/ThemeProvider.tsx`) usando `applyDesignTokens` de `src/lib/colorTokens.ts`. Mapeamento:
- **accent_color** → `--accent`, `--bordeaux`, `--bordeaux-light`, `--primary`, `--ring`, `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground`
- **background_color** → `--background`, `--popover`, `--card`, `--muted`, `--border`, `--input`, `--primary-foreground`, `--accent-foreground`, `--cashmere`
- **secondary_color** → `--secondary`, `--greige`, `--muted-foreground`

Cache em `localStorage` evita flash de cor antiga. Footer usa `bg-accent text-accent-foreground` para responder ao tema. Nunca hardcode cores em componentes — sempre usar tokens semânticos.

## Typography
- **Headings (h1–h6, `font-display`, `.text-display`, `.text-serif`)**: **Noto Serif** — pesos 300, 400, 500, 600 + variantes itálicas. Italic é o tom editorial padrão para headlines de hero/seção.
- **Body, UI, labels, botões (`font-body`)**: Inter — pesos 300, 400, 500, 600.
- **Removidos**: Cormorant Garamond e Raleway (descontinuados).
- Regra: nenhuma outra família serifada deve ser introduzida. `text-serif` aponta para Noto Serif (família única).

## Shapes
- `--radius: 0.75rem` (token padrão; propaga via shadcn).
- Botões pill e controles de mídia: `rounded-full`.
- Aplica-se ao site público e ao painel admin.
