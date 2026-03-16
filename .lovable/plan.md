

## Dois Novos Módulos Admin: Agenda & Visitas + Relatórios & Inteligência

### Módulo A: Agenda & Visitas (`/admin/agenda`)

**Arquivo: `src/pages/admin/Agenda.tsx`**

Layout em duas colunas (lg:grid-cols-3):

- **Coluna principal (col-span-2)**: Calendário mensal customizado usando shadcn Calendar expandido (modo visual de agenda). Cada dia com visitas mostra um indicador (dot). Ao clicar em um dia, exibe as visitas daquele dia abaixo. Ao clicar em horário vazio, abre o `ScheduleVisitModal` existente.

- **Coluna lateral (col-span-1)**:
  - **Card "Check-in Diário"**: Lista visitas confirmadas para hoje (query `visits_scheduling` filtrada por `visit_date = today`). Cada item mostra: avatar com iniciais do lead, nome, horário, property_code, e link externo para Google Maps (`https://www.google.com/maps/search/?api=1&query={address}`).
  - **Card "Conectar Agendas"**: UI-only (sem integração real). Dois botões estilizados: Google Calendar e Outlook, com ícones. Estado "Em breve" com tooltip.

**Dados**: Usa tabela `visits_scheduling` existente. Sem mudanças de schema.

---

### Módulo B: Relatórios & Inteligência (`/admin/relatorios`)

**Arquivo: `src/pages/admin/Reports.tsx`**

- **Header**: Título + Date Range Picker com botões rápidos ("7 dias", "Este Mês", "Ano") usando shadcn Popover + Calendar range mode.

- **Alpha Insight (IA)**: Card no topo com fundo `bg-[#2A070C]/5` e borda bordeaux sutil. Texto estático placeholder: "A procura por mansões no Tamboré 3 subiu 15% esta semana..."

- **Bento Grid de KPIs** (grid 2x2 ou 4 cols):
  - Total de Leads (count from `leads`)
  - Ciclo Médio de Vendas (placeholder "— dias")
  - Taxa de Conversão (leads fechados / total)
  - Valor Total em Pipeline (sum `deal_value`)

- **Gráficos com Recharts** (já instalado):
  - **Origem dos Leads**: Donut/Pie chart (`origin` field grouping)
  - **Conversão do Funil**: Bar chart horizontal (contagem por `pipeline_stage`)

**Dados**: Queries sobre tabelas `leads` e `visits_scheduling` existentes. Sem mudanças de schema.

---

### Routing & Sidebar

- `App.tsx`: Adicionar 2 rotas: `agenda` e `relatorios`
- `AdminSidebar.tsx`: Adicionar 2 itens: "Agenda" (CalendarCheck icon) e "Relatórios" (BarChart3 icon)

### Arquivos criados/editados

| Arquivo | Ação |
|---|---|
| `src/pages/admin/Agenda.tsx` | Criar |
| `src/pages/admin/Reports.tsx` | Criar |
| `src/App.tsx` | Editar (2 rotas) |
| `src/components/admin/AdminSidebar.tsx` | Editar (2 menu items) |

Sem migrações de banco. Sem dependências novas (Recharts já existe).

