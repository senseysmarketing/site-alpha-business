

## Central de Marketing & Alertas

Nova tela `/admin/marketing` com 4 seções principais, seguindo o design system existente (bg-white, border-border/50, shadow-none, fontes Raleway/Inter).

### 1. Estrutura de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/admin/Marketing.tsx` | Criar - pagina principal |
| `src/components/admin/marketing/SmartAlertsFeed.tsx` | Criar - feed lateral de alertas semaforicos |
| `src/components/admin/marketing/AIResponseDialog.tsx` | Criar - dialog "Gerar Resposta IA" com sugestao WhatsApp |
| `src/components/admin/marketing/DailyPlanCard.tsx` | Criar - micro-plano diario (5 tarefas) |
| `src/components/admin/marketing/LeadActivityTimeline.tsx` | Criar - timeline de interacoes do lead |
| `src/App.tsx` | Editar - adicionar rota `marketing` |
| `src/components/admin/AdminSidebar.tsx` | Editar - adicionar item "Marketing" com icone `Megaphone` |

### 2. Layout da Pagina

Grid de 2 colunas: conteudo principal (col-span-8) + feed lateral de alertas (col-span-4).

**Coluna Principal:**
- **Micro-plano Diario**: Card branco com 5 tarefas prioritarias geradas a partir dos leads (leads quentes sem contato recente, agendamentos pendentes, follow-ups atrasados). Checkbox para marcar como concluido (estado local). Dados vem de queries aos leads + visits_scheduling.
- **Log de Atividades**: Timeline vertical com icones coloridos por tipo (view, whatsapp, call, proposal). Busca `lead_activities` com join em `leads(name)`. Cada item mostra avatar/iniciais do lead, descricao, e tempo relativo (date-fns).
- **Botao "Gerar Resposta IA"**: Em cada item do log ou nos leads listados, botao que abre Dialog. A sugestao e gerada client-side com template string baseado no nome do lead, imovel de interesse e ultima atividade (sem chamada a API de IA, simulacao conforme solicitado).

**Coluna Lateral - Alertas Inteligentes:**
- Feed vertical de cards com borda esquerda colorida (4px):
  - **Vermelho** (`border-l-red-500 bg-red-50`): Leads quentes com atividades recentes (score="quente" e atividade nas ultimas 24h)
  - **Amarelo** (`border-l-amber-500 bg-amber-50`): Agendamentos pendentes (visits_scheduling sem confirmacao)
  - **Verde** (`border-l-green-500 bg-green-50`): Acoes concluidas ou leads que avancaram no pipeline
- Dados vem de queries combinadas: leads (score quente + atividades recentes), visits_scheduling (proximos 7 dias).

### 3. Dados (sem migracao)

Todas as tabelas necessarias ja existem: `leads`, `lead_activities`, `lead_notes`, `visits_scheduling`, `properties`. Nenhuma migracao necessaria.

### 4. Resposta IA (Simulacao)

Template client-side que gera mensagem personalizada:
```
Olá {lead.name}, vi que você se interessou pela residência no {property.condominium}...
```
Textarea editavel para o corretor ajustar antes de copiar. Botao "Copiar para WhatsApp" que copia e abre `https://wa.me/{phone}?text={encoded}`.

### 5. Micro-plano Diario

Query que busca:
1. Leads quentes sem contato ha mais de 2 dias
2. Visitas agendadas para hoje/amanha
3. Leads em estagio "proposta" sem atividade recente
4. Leads novos sem primeiro contato

Limita a 5 itens, ordena por prioridade (quente > agendamento > proposta > novo).

