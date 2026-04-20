

## Inverter Ordem + Refatorar "Regiões" e "Anuncie" — Estilo Editorial Limpo

Conforme o print: **Regiões primeiro, Formulário depois**. Ambos com header em uma linha e estética minimalista (sem eyebrow, sem itálico, sem fundo cinza, alinhamento à esquerda).

### 1. Inverter ordem em `Index.tsx`

Trocar:
```
<TeamSection />
<ContactSection />
<AlphavilleMapSection />
```
por:
```
<TeamSection />
<AlphavilleMapSection />
<ContactSection />
```

### 2. `AlphavilleMapSection.tsx` — Header simples + grid mais denso

- **Section**: trocar `bg-muted/50` por fundo padrão (transparente, igual demais seções). Manter `py-20 md:py-32` e padding lateral.
- **Header em uma linha** (substitui o bloco com eyebrow "Regiões" + título grande):
  - Remover `<motion.p>` "Regiões".
  - `<h2>` em Noto Serif (`text-display`), `text-2xl md:text-3xl font-normal text-foreground`, texto: `Conheça o seu futuro imóvel em Alphaville` (sem `<em italic>` em Alphaville — o print mostra tudo regular).
  - `mb-10` (em vez de `mb-12 md:mb-16`).
- **Grid**: aumentar para 8 colunas no desktop conforme print (`lg:grid-cols-8`), mantendo responsivo: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-8`.
- **Itens**: 
  - Remover `border-b border-border pb-3` (print não tem linha divisória).
  - Nome do condomínio: Noto Serif (`text-display`), `text-base font-normal text-foreground mb-1` (em vez de Inter medium).
  - Links "Comprar | Alugar": Inter `text-xs text-muted-foreground` (NÃO uppercase, NÃO tracking, NÃO Bordeaux). Hover: `hover:text-foreground transition-colors`. Separador `|` em `text-muted-foreground/50`.

### 3. `ContactSection.tsx` — Layout 2 colunas (imagem + form)

Conforme o print: imagem grande à esquerda, formulário à direita com labels acima dos inputs.

- **Section**: trocar `bg-muted/30` por fundo padrão (sem fundo cinza). Manter `py-20 md:py-32`.
- **Container**: ampliar para `max-w-7xl mx-auto px-6 md:px-12 lg:px-24`.
- **Grid**: `grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start`.

#### Coluna esquerda — imagem
- `<div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">`
- `<img>` com a imagem do corretor (usar uma das imagens já existentes em `src/assets/` — vou referenciar `team-1.jpg` ou similar; se não houver match, usar placeholder do hero/featured). **Decisão técnica**: como não há imagem específica do corretor in-context, usar a primeira imagem do membro de equipe (`team` settings) como fallback dinâmico, ou simplesmente uma imagem genérica de Alphaville já usada em outras seções. Para simplicidade e fidelidade visual, hardcode uma das imagens do `src/assets` que represente o conceito (ou criar prop `image` editável depois). **Nesta refatoração**: usar `import` de uma imagem existente — verificarei via list_dir o que está disponível na implementação. Fallback seguro: imagem do `featured-property` settings via `useSiteSettings("featured_property")`.

#### Coluna direita — formulário
- **Header em 1 bloco** (left-aligned, sem centralização):
  - Remover eyebrow "Anuncie".
  - `<h2>` em Noto Serif, `text-2xl md:text-4xl font-normal text-foreground leading-tight mb-8`, texto: `Seu imóvel ainda não está na Alpha Business?` (sem `<em italic>` em "Alpha Business").
  - Remover parágrafo descritivo "Envie suas informações...".
- **Form com labels acima**:
  - Cada campo: `<label>` em Inter `text-sm font-medium text-foreground mb-2 block` + `<input>`/`<textarea>` abaixo.
  - Labels: `Nome completo`, `E-mail`, `Telefone`, `Endereço completo do imóvel` (substitui placeholders).
  - Inputs: remover `placeholder`, fundo `bg-muted/60` (cinza claro como no print, em vez de `bg-background` com border visível), `border-0`, `px-4 py-3 rounded-md`, focus ring sutil.
  - Espaçamento: `space-y-5`.
  - Layout: empilhar todos os campos verticalmente (sem grid 2 colunas para email/telefone — print mostra full-width).
- **Botão Enviar**:
  - Pequeno, alinhado à esquerda (não full-width).
  - `bg-foreground text-background px-8 py-3 rounded-md text-sm` (preto/escuro como no print, não Bordeaux).
  - Texto em case natural: `Enviar` (sem uppercase, sem tracking).

### 4. Estado de sucesso
- Manter o bloco `success`, mas atualizar fundo para padrão (sem `bg-muted/30`) e tipografia para alinhar (h3 em Noto Serif `font-normal`).

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/Index.tsx` (reordenar: Map antes de Contact) |
| Editar | `src/components/AlphavilleMapSection.tsx` (header 1 linha, grid 8 col, sem bordas, links discretos) |
| Editar | `src/components/ContactSection.tsx` (layout 2 colunas, labels acima, sem fundo cinza, botão escuro pequeno) |
| Atualizar | `mem://features/alphaville/condo-grid` (refletir novo visual minimalista) |
| Atualizar | `mem://features/contact/redesign` (refletir layout 2 colunas com imagem) |

### Observações
- A imagem da coluna esquerda do form usará `useSiteSettings("featured_property")` (mesma usada no banner) como default — assim continua editável pelo admin sem código novo. Se preferir imagem fixa diferente, o admin troca pelo painel.
- Botões e inputs em case natural seguem o mesmo desvio intencional do `FeaturedPropertySection` (fidelidade ao print > regra global de uppercase em utility labels).
- Sem mudanças em tokens globais.

