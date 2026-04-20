

## Conectar Design System (Admin) às Cores Reais do Site

Hoje o bloco "Design System" em `/admin/configuracoes` salva 3 cores HEX (`accent_color`, `background_color`, `secondary_color`) em `site_settings.design_tokens`, mas o único efeito é setar uma variável `--color-accent-preview` que **não é usada em lugar nenhum**. As cores reais do site vêm dos tokens HSL fixos em `src/index.css` (`--background`, `--accent`, `--bordeaux`, `--cashmere`, `--greige`, etc.). Por isso #2A070C continua aparecendo em todo lugar.

### Estratégia

Criar um **Theme Provider global** que lê `design_tokens` do Supabase, converte HEX → HSL, e injeta nas variáveis CSS que o site inteiro já consome. Sem migração SQL, sem mudar o Tailwind, sem refatorar componentes.

### Mapeamento HEX → tokens CSS

| Campo no Admin | Token CSS atualizado | Onde aparece no site |
|---|---|---|
| **Cor de Acento** (`accent_color`) | `--accent`, `--bordeaux`, `--primary`, `--ring`, `--foreground` | Footer (fundo escuro), botões primários, headlines, links, preços |
| **Cor de Fundo** (`background_color`) | `--background`, `--popover`, `--primary-foreground`, `--accent-foreground` | Fundo geral do site, cards claros, texto sobre fundo escuro |
| **Cor Secundária** (`secondary_color`) | `--secondary`, `--greige`, `--muted-foreground`, `--cashmere` (versão clara) | Subtextos, badges secundários, separadores, detalhes neutros |

Observação: `--bordeaux-light` deriva automaticamente do acento (lightness +8%). `--card`, `--muted`, `--border` derivam do background (mistura sutil) para manter a hierarquia visual.

### Implementação

1. **Novo arquivo** `src/lib/colorTokens.ts`:
   - `hexToHSL(hex)` → string `"H S% L%"`
   - `applyDesignTokens(tokens)` → seta todas as variáveis CSS no `document.documentElement` com base no mapeamento acima.

2. **Novo componente** `src/components/ThemeProvider.tsx`:
   - Usa `useSiteSettings<DesignTokens>("design_tokens")`.
   - No `useEffect`, chama `applyDesignTokens(data)` quando os dados carregam.
   - Renderiza `{children}` sem markup adicional.
   - **Importante**: aplicar também ANTES do React montar (script inline no `index.html` ou `main.tsx`) para evitar flash de cor antiga — versão mínima: aplicar via `useLayoutEffect` no provider, com fallback de `localStorage` cacheado.

3. **Integrar em `src/App.tsx`**:
   - Envolver as rotas com `<ThemeProvider>` logo após o `QueryClientProvider`.
   - O admin **não** aplica os tokens em tempo real ao site público (só preview local) — mas após salvar, o `useSiteSettings` invalida a query e o ThemeProvider re-aplica em todas as abas/refresh.

4. **Preview ao vivo no Admin** (`SiteSettings.tsx`):
   - Trocar o `useEffect` atual (linha 552-554) por uma chamada a `applyDesignTokens(tokensForm)` para que o admin já mostre o preview real conforme o usuário ajusta as cores.
   - Ao salvar, o site público também atualiza no próximo carregamento.

5. **Resetar Padrão**: já funciona — apenas garante que o `applyDesignTokens` seja chamado no estado resetado.

### Arquivos a editar/criar

| Ação | Arquivo |
|------|---------|
| Criar | `src/lib/colorTokens.ts` — utilitários `hexToHSL` + `applyDesignTokens` |
| Criar | `src/components/ThemeProvider.tsx` — lê tokens do Supabase, aplica em `:root` |
| Editar | `src/App.tsx` — envolver rotas com `<ThemeProvider>` |
| Editar | `src/pages/admin/SiteSettings.tsx` — trocar preview parcial por `applyDesignTokens` completo |
| Atualizar | `mem://style/visual-identity` — registrar que cores do site são dinâmicas via `site_settings.design_tokens` |

### Considerações sobre identidade visual

- A "Quiet Luxury" depende do contraste suave entre off-white + bordeaux. Se o usuário escolher cores com pouco contraste (ex: dois tons claros), o site pode ficar ilegível. Mantenho o reset para os defaults atuais (#2A070C / #F5F0EB / #8B7D6B) para garantir um caminho de volta seguro.
- **Header transparente → bordeaux** (na rolagem) usa `--bordeaux` — vai trocar junto.
- **Footer** (recém ajustado para #1F1F1F) hoje é hardcoded, **não** vai responder ao Design System a menos que troquemos sua cor por `bg-accent` ou `bg-bordeaux`. **Decisão**: manter o footer dinâmico via `--accent` (assim o admin controla também o footer). Se o usuário preferir manter o footer fixo em #1F1F1F, deixamos hardcoded.

### Observações

- Sem migração SQL — usa `site_settings.design_tokens` que já existe.
- Conversão HEX→HSL é matemática pura, ~30 linhas, sem lib externa.
- Performance: aplicação de variáveis CSS é instantânea, sem re-render do React.
- Em caso de falha do Supabase, fallback para os defaults do CSS (`src/index.css` permanece como baseline).

