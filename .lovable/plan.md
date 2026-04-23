

## Revisão de Permissões — Status e Ajustes

### O que JÁ está correto para admin

- **Edge function `create-team-member`**: valida JWT do chamador, exige `has_role(admin)`, cria user no Supabase Auth com `email_confirm: true` (login imediato, sem precisar confirmar e-mail), insere `team_profiles` e `user_roles` com o role escolhido. Convidar um admin funciona — ele loga direto com email/senha.
- **RLS de todas as 12 tabelas**: todas as políticas de escrita (`INSERT/UPDATE/DELETE`) usam `has_role(auth.uid(), 'admin')`. Um admin convidado terá acesso total a: properties, leads, lead_notes, lead_activities, blog_posts, expenses, transactions, market_data, site_settings, team_profiles, user_roles, system_audit_logs, visits_scheduling. **Nenhum ajuste de RLS necessário.**
- **Sidebar**: admin enxerga todos os 12 itens do menu (Dashboard, Imóveis, CRM, Equipe, Agenda, Relatórios, Financeiro, Marketing, Blog, Importar, Atividade, Configurações).
- **`useAuth`**: lê `user_roles` corretamente e expõe `role` + `isAdmin`.

### Problemas encontrados (não afetam admin, mas são falhas reais)

**1. Rotas admin desprotegidas por role no `App.tsx`**
`ProtectedRoute` aceita `allowedRoles`, mas nenhuma rota usa. Resultado: um corretor/assistente que descubra a URL `/admin/financeiro`, `/admin/configuracoes`, `/admin/atividade` ou `/admin/importar` consegue abrir a página (apesar das ações de escrita serem bloqueadas pela RLS, o conteúdo da tela carrega).

**Correção**: envolver as rotas restritas com `<ProtectedRoute allowedRoles={[...]}>` espelhando a matriz já definida na sidebar:

```text
/admin/financeiro    → ["admin"]
/admin/configuracoes → ["admin"]
/admin/atividade     → ["admin"]
/admin/importar      → ["admin"]
/admin/relatorios    → ["admin", "gerente"]
/admin/marketing     → ["admin", "gerente"]
/admin/blog/*        → ["admin", "gerente"]
```

**2. Botão "Convidar Membro" visível a todos em `/admin/equipe`**
A edge function bloqueia não-admins (HTTP 403), mas o botão aparece para qualquer role. UX confuso.

**Correção**: em `Team.tsx`, renderizar `<InviteMemberDialog />` apenas se `isAdmin` (via `useAuth`).

**3. Edição de outros membros em `team_profiles`**
A política `Members can update own team_profile` permite que qualquer membro edite o próprio perfil — correto. Admin pode editar todos via `Admins can update any team_profile` — correto.

### Resumo para o teste do admin

Quando você convidar um admin pelo botão "Convidar Membro":
1. Ele recebe email/senha definidos no formulário e loga imediatamente em `/admin/login`.
2. Vê os 12 itens do menu lateral.
3. Tem permissão total de leitura/escrita em todas as tabelas via RLS.
4. Pode convidar/editar/desativar outros membros e alterar roles.

### Arquivos editados

- `src/App.tsx` (adicionar `allowedRoles` nas rotas restritas)
- `src/pages/admin/Team.tsx` (esconder botão "Convidar Membro" para não-admins)

