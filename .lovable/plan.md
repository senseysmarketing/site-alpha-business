

## Refatorar "Featured Banner" — Layout Split Editorial

Reformular `FeaturedPropertySection.tsx` para espelhar o print: card retangular dividido em duas colunas — esquerda com fundo escuro e conteúdo textual, direita com imagem real do condomínio sangrando até a borda. Sem overlay escuro sobre toda a imagem.

### 1. Estrutura — split 50/50

Substituir o layout atual (imagem de fundo + overlay escuro + conteúdo centralizado) por um grid de duas colunas:

- Wrapper externo: `relative rounded-lg overflow-hidden grid md:grid-cols-2 min-h-[420px]`
- **Coluna esquerda** (`bg-[#1a1a1a]` ou `bg-foreground` — cinza-escuro/preto suave, NÃO Bordeaux): conteúdo textual com `p-10 md:p-14 flex flex-col justify-center`.
- **Coluna direita**: imagem real do condomínio (`object-cover w-full h-full`), sem overlay.
- **Mobile**: empilha (imagem em cima, conteúdo embaixo) via `grid-cols-1 md:grid-cols-2`.

### 2. Transição suave entre colunas (desktop)

Pequeno gradiente lateral para evitar corte duro entre o painel escuro e a foto:
- Sobre a coluna direita, na borda esquerda: `absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1a1a1a] to-transparent hidden md:block pointer-events-none`.

### 3. Conteúdo da coluna esquerda (alinhado à esquerda, não centralizado)

Trocar `text-center items-center` por `text-left items-start`:

1. **Tagline**: `text-xs tracking-[0.25em] uppercase text-white/50 mb-5` — texto: `TAMBORÉ I, II, III` (default atualizado).
2. **Título**: Noto Serif, `text-3xl md:text-4xl lg:text-5xl font-normal text-white leading-[1.1] mb-6 max-w-md`. Sem itálico parcial — o print mostra título inteiro em regular serif. Manter suporte a `*texto*` apenas se settings vier com marcação, mas renderizar como `font-normal` (sem `italic`).
3. **Descrição**: Inter, `text-sm md:text-base text-white/60 leading-relaxed mb-8 max-w-md`.
4. **Botões**: `flex flex-wrap gap-3` — cada botão menor que o atual:
   - `px-6 py-3 border border-white/25 text-white text-sm rounded-md hover:bg-white/10 transition-colors`
   - Sem `tracking-[0.15em]` nem `uppercase` — o print mostra "Tamboré I" em case normal.
   - Texto em Inter peso medium.

### 4. Defaults atualizados

- `DEFAULT_TAGLINE`: `"Tamboré I, II, III"` (era "Conheça os condomínios").
- `DEFAULT_TITLE`: `"As propriedades mais que especiais em Alphaville"` (sem asteriscos — título inteiro regular).
- `DEFAULT_DESCRIPTION`: `"A Alpha Business vem se consolidando como referência em vendas de propriedades de alto luxo. Encontre uma perfeita para você."`
- `DEFAULT_BUTTONS`: mantidos (Tamboré I/II/III).

### 5. Animações

Manter framer-motion nos elementos (tagline, título, descrição, botões) com os mesmos delays atuais — só mudam classes/posicionamento.

### 6. Limpeza

- Remover o overlay full `bg-[hsl(350,60%,5%)]/80` (não usado mais — fundo escuro vem da coluna esquerda).
- Remover `min-h-[400px] md:min-h-[450px]` duplicado no inner div (fica só no wrapper).
- Manter `useSiteSettings` e `renderWithItalic` (caso settings ainda mande `*texto*`).

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/components/FeaturedPropertySection.tsx` (refatoração de layout: grid split + conteúdo left-aligned) |
| Atualizar | `mem://features/featured-property/banner-layout` (refletir split 50/50 com gradiente de borda) |

### Observações

- Sem mudanças em tokens globais.
- Fundo escuro usa `#1a1a1a` (quase preto) para combinar com o print — diferente do Bordeaux usado em outras seções; é uma exceção pontual de banner editorial.
- Botões em case natural (sem uppercase) — quebra do padrão de utility labels, intencional para fidelidade ao print.

