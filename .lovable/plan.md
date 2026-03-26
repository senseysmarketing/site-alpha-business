

## Tornar Relatórios 100% Funcional e Automático

### 1. Calcular Ciclo Médio de Vendas
**Arquivo:** `src/pages/admin/Reports.tsx`
- Para leads com `pipeline_stage = 'fechados'`, calcular diferença em dias entre `created_at` e `updated_at`
- Exibir a média arredondada no KPI (ex: "32 dias")
- Se não houver leads fechados, mostrar "—"

### 2. Adicionar estágio "Visita Agendada" ao funil
- Incluir `visita_agendada` entre "contato" e "visita" no array de stages do gráfico de barras
- Adicionar label no `STAGE_LABELS`

### 3. Alpha Insight dinâmico (baseado em dados reais)
- Gerar texto automático analisando os dados filtrados:
  - Origem com mais leads no período
  - Estágio com maior concentração
  - Valor total em pipeline
  - Ciclo médio calculado
- Montar a string de insight programaticamente (sem IA externa, apenas lógica local)

### 4. Adicionar KPI de Receita (transactions)
- Buscar `transactions` do Supabase
- Adicionar KPI "Receita Líquida" calculando `(sale_value × commission_pct / 100) - broker_payout` das transações com status "pago"
- Filtrar por período selecionado usando `created_at`

### 5. Adicionar gráfico de Leads por Semana (LineChart)
- Agrupar `filteredLeads` por semana (usando `startOfWeek` do date-fns)
- Novo card com `LineChart` do Recharts mostrando evolução temporal
- Eixo X = semanas, Eixo Y = quantidade de leads

### 6. Adicionar gráfico de Receita por Mês (BarChart)
- Agrupar transações pagas por mês
- Novo card com BarChart vertical mostrando comissão líquida mensal

### Arquivos a editar
- `src/pages/admin/Reports.tsx` — todas as alterações acima

### Layout final (6 cards de gráfico em grid 2×3)
```text
Row 1: [Origem dos Leads (Donut)]  [Conversão do Funil (Bar H)]
Row 2: [Leads por Semana (Line)]   [Receita por Mês (Bar V)]
```

