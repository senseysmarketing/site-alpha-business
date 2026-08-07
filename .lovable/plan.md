# Corrigir score/estágio que "volta para Morno" em /admin/leads

## O que está acontecendo

O modal de detalhes do lead exibe os dados a partir de uma cópia congelada do lead, guardada no estado da tela de Pipeline no momento em que o card foi clicado. Quando o usuário troca o Score (ou o Estágio):

1. A alteração é gravada no banco corretamente.
2. A lista de leads é recarregada.
3. Mas o modal continua lendo a cópia antiga — então o seletor volta a mostrar o valor anterior, dando a impressão de que "não salvou" e de que sempre retorna para Morno (Morno também é o valor exibido por padrão quando o score não é reconhecido).

Ou seja: é um problema de sincronização de tela, não de gravação.

## Correção

- Na tela de Pipeline, guardar apenas o **id** do lead selecionado e derivar o lead sempre da lista atualizada, para que o modal receba sempre o dado mais recente.
- No modal, garantir que os seletores de Score e Estágio reflitam imediatamente a alteração (atualização otimista) e revertam apenas se o banco retornar erro.
- Aplicar o mesmo comportamento nas demais edições do modal (valor do negócio, reatribuição), que sofrem do mesmo congelamento.

## Detalhes técnicos

- `src/pages/admin/CRM.tsx`: substituir o estado `selectedLead: Lead | null` por `selectedLeadId: string | null`; calcular `selectedLead` via `useMemo` a partir de `leads`. Ajustar `handleCardClick`, o auto-open por `?leadId=`, e os callbacks do `LeadEditModal` (`onSaved` passa a apenas setar o id e invalidar a query).
- `src/components/admin/crm/LeadDetailModal.tsx`: nas funções `handleScoreChange`, `handleStageChange`, `handleReassign` e `handleSaveDealValue`, aplicar update otimista no cache do React Query (`queryClient.setQueryData(["leads"], ...)`) antes do request e invalidar depois; em caso de erro, invalidar para reverter.
- Manter `value={lead.score}` no `Select`, que passará a receber o valor atualizado via cache.
