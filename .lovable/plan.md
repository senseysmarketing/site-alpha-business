

## Integração: Formulário de Contato + Agendamento → CRM Pipeline + Agenda

### Problema atual
1. O formulário "Fale Conosco" (`ContactSection.tsx`) apenas exibe um toast — não salva nada no banco
2. O modal "Agendar Visita" (`ScheduleVisitModal.tsx`) salva em `visits_scheduling` mas não cria um lead no CRM
3. Nenhum dos dois fluxos alimenta o pipeline de leads do admin

### Plano

#### 1. Formulário "Fale Conosco" → Criar lead no CRM
**Arquivo:** `src/components/ContactSection.tsx`

- Importar `supabase` client
- No `handleSubmit`, inserir um registro na tabela `leads` com:
  - `name`, `phone`, `email` do formulário
  - `origin: "fale_conosco"`
  - `pipeline_stage: "novos"`
  - `score: "morno"`
  - `ai_insights`: incluir o assunto selecionado e a mensagem como contexto
- Manter o toast de sucesso, adicionar tratamento de erro

#### 2. Agendamento de Visita → Criar lead + vincular imóvel
**Arquivo:** `src/components/property/ScheduleVisitModal.tsx`

- Após inserir em `visits_scheduling` com sucesso, inserir também na tabela `leads`:
  - `name`, `phone`, `email` do formulário
  - `origin: "agendamento_visita"`
  - `pipeline_stage: "visita_agendada"` (já vai direto para o estágio correto)
  - `score: "quente"`
  - `property_id`: vincular ao imóvel que o cliente estava visualizando
- Para isso, adicionar `propertyId` (UUID) como prop opcional do modal
- Atualizar os locais que usam o modal (`PropertyDetail.tsx`, `PropertySidebar.tsx`, `Agenda.tsx`) para passar o `propertyId`

#### 3. Atualizar o LeadCard para exibir novas origens
**Arquivo:** `src/components/admin/crm/LeadCard.tsx`

- Adicionar ícones para as novas origens: `fale_conosco` (ícone de envelope/formulário) e `agendamento_visita` (ícone de calendário)
- Adicionar `"fale_conosco"` e `"agendamento_visita"` ao select de origens no `NewLeadDialog.tsx`

#### 4. PropertyDetail — passar property ID ao modal
**Arquivo:** `src/pages/PropertyDetail.tsx`

- O componente já usa `mockProperties` com `property.id` — verificar se esse ID corresponde ao UUID do Supabase
- Como a rota é `/imovel/:id` e o user está acessando um imóvel real do Supabase (pela URL: `aeff309f-...`), o `id` do `useParams` é o UUID correto
- Passar `propertyId={id}` ao `ScheduleVisitModal`

#### 5. PropertySidebar — receber e passar propertyId
**Arquivo:** `src/components/property/PropertySidebar.tsx`

- Adicionar prop `propertyId` e repassar ao `ScheduleVisitModal`

### Arquivos a editar
- `src/components/ContactSection.tsx` — inserir lead no Supabase
- `src/components/property/ScheduleVisitModal.tsx` — inserir lead após agendar visita
- `src/pages/PropertyDetail.tsx` — passar `propertyId` ao modal
- `src/components/property/PropertySidebar.tsx` — receber e passar `propertyId`
- `src/components/admin/crm/LeadCard.tsx` — ícones para novas origens
- `src/components/admin/crm/NewLeadDialog.tsx` — novas opções de origem no select

### Resultado esperado
- Toda submissão do "Fale Conosco" gera um lead no pipeline (estágio "Novos", origem "Fale Conosco")
- Todo agendamento de visita gera um lead no pipeline (estágio "Visita Agendada", origem "Agendamento de Visita") com o imóvel vinculado e já aparece na agenda
- O admin vê a origem de cada lead claramente no card do CRM

