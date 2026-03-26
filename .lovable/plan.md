

## Sincronizar Atividade Recente no Dashboard + Paginação na tela de Atividade

### 1. Dashboard — Atividade Recente e Últimos Leads reais
**Arquivo:** `src/pages/admin/Dashboard.tsx`

- Buscar os 5 registros mais recentes de `system_audit_logs` via `useQuery`
- Renderizar mini-timeline no card "Atividade Recente" (avatar + nome + ação + tempo relativo)
- Buscar os 5 leads mais recentes de `leads` para o card "Últimos Leads" (nome, origem, data)
- Substituir os placeholders atuais por dados reais

### 2. Atividade — Paginação real
**Arquivo:** `src/pages/admin/AuditLog.tsx`

- Trocar o `PAGE_SIZE` de 50 para 15 (quantidade por página)
- Substituir o botão "Carregar mais" por paginação real com botões Anterior/Próximo e indicador de página
- Manter filtros de data e usuário funcionando com a paginação

### Arquivos a editar
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/AuditLog.tsx`

