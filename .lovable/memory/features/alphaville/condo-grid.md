---
name: Alphaville Condo Grid
description: Grade editorial minimalista de condomínios ativos com links Comprar/Alugar discretos
type: feature
---
A seção `AlphavilleMapSection` apresenta os condomínios ativos em uma grade densa e editorial, sem fundo cinza (`bg` padrão), com header em uma única linha: `<h2>` em Noto Serif `text-2xl md:text-3xl font-normal` com texto "Conheça o seu futuro imóvel em Alphaville" (sem eyebrow, sem itálico), `mb-10`.

Grid responsivo: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-8`. Itens sem borda divisória — apenas nome do condomínio em Noto Serif `text-base font-normal` + linha de ações com botões "Comprar" e "Alugar" em Inter `text-xs text-muted-foreground` (case natural, sem uppercase nem tracking, sem cor Bordeaux), separados por `|` em `text-muted-foreground/50`. Hover muda cor para `text-foreground`.

Dados vêm da tabela `properties` filtrando `status=ativo` e `condominium not null`, agrupados por condomínio com flags `hasVenda`/`hasAluguel`. Cliques redirecionam para `/imoveis?condo=...&transactionType=venda|aluguel`.
