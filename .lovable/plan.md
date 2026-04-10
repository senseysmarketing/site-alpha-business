

## Criar Usuário com Senha ao Adicionar Membro

### Problema
Atualmente o dialog de "Convidar Membro" cria apenas um registro na tabela `team_profiles` com um `user_id` placeholder. O novo membro não consegue fazer login.

### Solução
Criar uma Edge Function `create-team-member` que usa a Admin API do Supabase (`auth.admin.createUser`) para criar o usuário com e-mail e senha, sem exigir confirmação de e-mail. A function também cria o `team_profile` e o `user_role` automaticamente.

### Arquivos

**1. Criar `supabase/functions/create-team-member/index.ts`**
- Recebe: `email`, `password`, `fullName`, `role`, `creci`, `phone`
- Valida que todos os campos obrigatórios existem e que a senha tem pelo menos 6 caracteres
- Usa `supabase.auth.admin.createUser({ email, password, email_confirm: true })` para criar o usuário já confirmado
- Insere o registro em `team_profiles` com o `user_id` real retornado
- Insere o registro em `user_roles` com o role selecionado (admin, gerente, corretor, assistente)
- Verifica que quem chamou é admin (via token JWT do header Authorization)

**2. Editar `src/components/admin/team/InviteMemberDialog.tsx`**
- Adicionar campo "Senha" (type password) ao formulário, com validação mínima de 6 caracteres
- Trocar a lógica de submit: em vez de inserir direto no `team_profiles`, chamar `supabase.functions.invoke('create-team-member', { body: { ... } })`
- Tratar erros retornados pela edge function (ex: e-mail já existe)

### Fluxo
1. Admin preenche nome, e-mail, senha, cargo, CRECI, telefone
2. Frontend chama a edge function
3. Edge function cria o auth user (já confirmado), o team_profile e o user_role
4. Novo membro pode fazer login imediatamente com e-mail e senha

