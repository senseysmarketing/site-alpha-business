

## Rebrand: Cor Principal, Logo, Fonte do Cabeçalho e Preloader

Primeira etapa do redesign do site principal. Vou alterar a cor de marca (de Bordeaux para `#1f1f1f`), trocar a logo, mudar a fonte do cabeçalho para Roboto e atualizar o preloader.

### 1. Cor principal — `#1f1f1f`
**Arquivo:** `src/index.css`
- Substituir os tokens HSL que hoje representam o bordeaux (`350 60% 10%`) por `0 0% 12%` (equivalente a `#1f1f1f`):
  - `--primary`, `--accent`, `--ring`, `--foreground` (ajustar para preservar contraste)
  - `--bordeaux: 0 0% 12%` (mantém o nome do token para não quebrar referências em todo o código, mas com o novo valor)
  - `--bordeaux-light: 0 0% 20%`
- O token continua se chamando `bordeaux` internamente apenas para evitar refatorar dezenas de classes (`bg-bordeaux`, `text-bordeaux`). Visualmente passa a ser cinza-escuro `#1f1f1f`.

### 2. Logo nova
- Copiar `user-uploads://Logo-Rafael.png` para `src/assets/logo-rafael.png`
- **Arquivo:** `src/components/Header.tsx`
  - Trocar import `logoAlpha` → `logoRafael`
  - Remover `brightness-0 invert` (a logo já vem com cores próprias, branca + detalhe vermelho)
  - Trocar a cor do header scrolled de `bg-[#2A070C]/95` para `bg-[#1f1f1f]/95` e o menu mobile de `bg-[hsl(350,60%,5%)]` para `bg-[#1f1f1f]`
- **Arquivo:** `src/components/Preloader.tsx`
  - Trocar import `logoAlpha` → `logoRafael`

### 3. Fonte do cabeçalho — Roboto Regular
**Arquivos:** `src/index.css` + `src/components/Header.tsx`
- Adicionar Roboto ao `@import` do Google Fonts
- Criar utilitário `font-roboto` (ou aplicar inline `style={{ fontFamily: 'Roboto, sans-serif' }}`) nos itens de navegação, botão "Anuncie seu imóvel" e menu mobile do Header (peso 400 / Regular)

### 4. Preloader na nova cor
**Arquivo:** `src/components/Preloader.tsx`
- Trocar `bg-bordeaux` por `bg-[#1f1f1f]` (ou já fica automático se eu atualizar o token `--bordeaux` no CSS — vou usar essa abordagem: token atualizado, classes existentes seguem funcionando)
- Logo do preloader passa a ser a Logo Rafael

### Observações
- Mantenho o nome do token `bordeaux` no CSS (apenas o valor muda) para não precisar refatorar dezenas de componentes nesta etapa. Em etapas futuras do redesign podemos renomear semanticamente.
- Esta é a Parte 1. Próximas etapas (tipografia geral, hero, seções, footer, etc.) virão nos próximos prompts.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/index.css` (tokens de cor + import Roboto) |
| Editar | `src/components/Header.tsx` (logo, fonte Roboto, cores) |
| Editar | `src/components/Preloader.tsx` (logo nova) |
| Adicionar | `src/assets/logo-rafael.png` (copiada do upload) |

