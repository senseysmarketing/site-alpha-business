

## Refinamento Global — Arredondamento Consistente

Aplicar arredondamento total como padrão visual em todo o site (público + admin), substituindo o atual padrão "bordas retas / `rounded-sm`".

### Mudança de diretriz
- **Antes**: bordas retas ou `rounded-sm` em todo lugar; `rounded-full` proibido.
- **Depois**: arredondamento generoso como linguagem visual padrão. Botões, inputs, cards, badges, controles de mídia e elementos de UI passam a ter cantos arredondados.

### 1. Token global de raio (`src/index.css`)
- Aumentar `--radius` de `0.25rem` para `0.75rem`.
- Isso propaga automaticamente para todos os componentes shadcn que usam `rounded-lg` / `rounded-md` / `rounded-sm` via `tailwind.config.ts`:
  - `lg` = `var(--radius)` → 12px
  - `md` = `calc(var(--radius) - 2px)` → 10px
  - `sm` = `calc(var(--radius) - 4px)` → 8px
- Resultado: Cards, Buttons, Inputs, Selects, Dialogs, Sheets, Drawers, Dropdowns, Tabs, Badges, Toasts e o restante do shadcn ficam arredondados sem edição arquivo a arquivo.

### 2. Hero — controles de mídia (`src/components/HeroSection.tsx`)
- Setas de navegação (`w-12 h-12`): adicionar `rounded-full`.
- Botão Play/Pause (`w-9 h-9`): adicionar `rounded-full`.
- Barras de progresso desktop (trilho + preenchimento): adicionar `rounded-full`.
- Barra única mobile (1px): adicionar `rounded-full`.
- Botão "Saiba Mais" do slide: adicionar `rounded-full` para acompanhar o estilo pill dos controles.

### 3. Memória / diretrizes
- Atualizar `mem://index.md` (Core): trocar a regra "Straight edges or minimal rounding (rounded-sm). NEVER use highly circular corners." por:
  - **Shapes**: Generous rounding everywhere. `--radius: 0.75rem` é o padrão. Controles de mídia e botões pill usam `rounded-full`. Aplica-se ao site público E ao painel admin para consistência visual.
- Atualizar `mem://style/visual-identity` com a nova regra de raio.

### Escopo
- Site público: Header, Hero, SearchBar, cards de imóveis, Footer, modais — todos herdam o novo raio automaticamente.
- Painel admin (`/admin/*`): Sidebar, Header, Cards, tabelas, formulários, dialogs — todos herdam automaticamente via tokens shadcn.
- Não há necessidade de tocar componente por componente; a mudança no token + ajustes pontuais no Hero cobre o site inteiro.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/index.css` (`--radius` 0.25rem → 0.75rem) |
| Editar | `src/components/HeroSection.tsx` (`rounded-full` nos controles + botão CTA) |
| Editar | `mem://index.md` (regra de Shapes) |
| Editar | `mem://style/visual-identity` (token de raio) |

### Observações
- Nenhuma mudança em `tailwind.config.ts` (já lê `--radius` dinamicamente).
- Componentes que usam `rounded-none` explicitamente (se houver) permanecem retos por intenção — não vou caçar e reverter.
- Avatares circulares da equipe e badges arredondados continuam como estão.

