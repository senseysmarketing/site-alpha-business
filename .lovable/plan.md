

## Tornar a Gestão Financeira totalmente funcional

### Problemas atuais
1. **Despesas não aparecem** — são buscadas do banco mas não há tabela no UI para exibi-las
2. **Query de despesas sem join** — `expenses.select("*")` não traz o nome do imóvel vinculado
3. **Sem criar transações** — não há botão/dialog para registrar novas transações (vendas/comissões)
4. **Sem editar status** — não é possível marcar transação como "pago" ou "cancelado"
5. **Sem excluir despesas** — não há ação de remoção
6. **Dashboard desconectado** — não mostra KPI financeiro

### Plano

#### 1. Corrigir query de despesas com join
**Arquivo:** `src/pages/admin/Financial.tsx`
- Alterar `supabase.from("expenses").select("*")` para `select("*, properties(title, code, photos)")` para trazer dados do imóvel

#### 2. Adicionar tabela de Despesas no UI
**Arquivo:** `src/pages/admin/Financial.tsx`
- Adicionar um card com `<Table>` abaixo da tabela de Transações
- Colunas: Imóvel (thumb + título), Categoria (badge com label), Valor, Descrição, Data, Ações (excluir)
- Botão de excluir despesa com confirmação

#### 3. Criar dialog para adicionar Transações
**Arquivo:** `src/pages/admin/Financial.tsx`
- Novo botão "Registrar Transação" ao lado de "Adicionar Despesa"
- Dialog com campos: Imóvel (select), Valor da Venda, Comissão (%), Repasse Corretor, Status
- Insert na tabela `transactions` ao salvar

#### 4. Permitir editar status de transações inline
**Arquivo:** `src/pages/admin/Financial.tsx`
- Tornar a coluna Status clicável com `<Select>` inline para alterar entre pendente/pago/cancelado
- Update no Supabase ao trocar

#### 5. Gráfico de despesas por categoria (substituir donut vazio)
**Arquivo:** `src/pages/admin/Financial.tsx`
- Adicionar gráfico Donut de despesas agrupadas por categoria ao lado do gráfico de origem de receita (ou substituir quando não há transações)

#### 6. Sincronizar KPI financeiro no Dashboard
**Arquivo:** `src/pages/admin/Dashboard.tsx`
- Adicionar um KPI card com receita líquida total (query simples em `transactions`)

### Arquivos a editar
- `src/pages/admin/Financial.tsx` — tabela de despesas, dialog de transações, edição de status, gráfico de despesas
- `src/pages/admin/Dashboard.tsx` — KPI financeiro

