

## Ajuste: Margem e Cor das Colunas Kanban

### Problema
1. **Margem duplicada**: O `AdminLayout` já aplica `p-6` no `<main>`. O CRM adiciona outro `p-6` no wrapper, gerando padding duplo (48px total vs 24px nas outras telas).
2. **Cor das colunas**: As colunas usam `bg-background` que mapeia para o tema, mas visualmente aparecem com tom bege/off-white. Precisam ser brancas (`bg-white`) como a tabela de imóveis.

### Mudanças em `src/pages/admin/CRM.tsx`

1. **Remover `p-6`** do div wrapper raiz — trocar `<div className="p-6">` por `<div>`
2. **Colunas**: trocar `bg-background` por `bg-white` no container da coluna
3. **Header da coluna**: trocar `bg-background/90` por `bg-white/90`
4. **Drag-over state**: trocar `bg-background border-primary/20` por `bg-white border-primary/20`

Resultado: margens idênticas às telas de Dashboard e Imóveis, colunas brancas consistentes com a tabela.

