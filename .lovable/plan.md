

## Tela de Gestão Financeira & Comissões

### 1. Migração de Banco (Supabase)

Criar duas tabelas novas:

**`transactions`**: id, property_id (FK properties), sale_value, commission_pct, broker_payout, broker_user_id (nullable, uuid), status (enum: pendente/pago/cancelado), closed_at, created_at.

**`expenses`**: id, property_id (FK properties), category (enum: foto_video, trafego_pago, manutencao, outros), description, amount, created_at.

RLS: Admin vê tudo (via `has_role`). Usuário autenticado vê apenas transações onde `broker_user_id = auth.uid()`. Expenses somente admin.

### 2. Novo Arquivo: `src/pages/admin/Financial.tsx`

**Header**: Título "Gestão Financeira" + subtítulo, seguindo padrão de Properties/Reports.

**4 KPI Cards** (Bento Grid, grid-cols-4):
- **VGV**: Sum de `sale_value` de transactions. Fonte monospaçada (`font-mono`).
- **Receita Líquida Alpha**: `sale_value * commission_pct - broker_payout`. Sparkline em Bordeaux usando Recharts `<AreaChart>` mini.
- **Comissões a Pagar**: Sum de `broker_payout` onde status=pendente. Badge de alerta (`<Badge variant="destructive">`) se valor > 0.
- **ROI Médio/Campanha**: (receita - despesas) / despesas. Indicador com ícone TrendingUp.

**Tabela de Transações**: Usando shadcn Table (mesmo padrão de Properties). Colunas: Imóvel (miniatura da foto + título), Valor da Venda, Comissão Total (%), Repasse Corretor, Status (Badge), Ações (botão editar).

**Modal "Adicionar Despesa"**: shadcn Dialog com form: Select de imóvel (properties), Select de categoria (Foto/Vídeo, Tráfego Pago, Manutenção, Outros), valor, descrição. Insert na tabela `expenses`.

**Gráficos Recharts** (2 colunas):
- **Origem da Receita**: Donut chart (Vendas vs Locação, agrupando `transaction_type` das properties vinculadas).
- **Ciclo de Vendas por Condomínio**: Bar chart horizontal (agrupando por `condominium` das properties).

### 3. Routing & Sidebar

- `App.tsx`: Adicionar rota `financeiro` dentro do grupo admin.
- `AdminSidebar.tsx`: Adicionar item "Financeiro" com ícone `Wallet` entre Relatórios e Configurações.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migração SQL | Criar tabelas `transactions` e `expenses` + RLS |
| `src/pages/admin/Financial.tsx` | Criar |
| `src/App.tsx` | Editar (1 rota) |
| `src/components/admin/AdminSidebar.tsx` | Editar (1 menu item) |

