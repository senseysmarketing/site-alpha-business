

## Padronizar visual da tela Financeira com fundo branco nos cards

A tela de Relatórios usa `bg-white border-border/50 shadow-none` nos cards, enquanto a tela Financeira usa apenas `border-border/50` (herdando o `bg-card` padrão, que é bege).

### Alterações em `src/pages/admin/Financial.tsx`

Adicionar `bg-white shadow-none` em todos os `<Card>` da página:

1. **4 KPI cards** (linhas ~195, 205, 215, 230) — adicionar `bg-white shadow-none`
2. **Tabela de Transações** (card wrapper) — adicionar `bg-white shadow-none`
3. **2 cards de gráficos** (Origem da Receita e Ciclo de Vendas) — adicionar `bg-white shadow-none`

Nenhum outro arquivo precisa ser alterado.

