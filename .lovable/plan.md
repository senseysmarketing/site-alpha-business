

## Módulo: Gestão de Equipe & Permissões (Alpha Team)

Este é um módulo grande. Vou dividi-lo em partes implementáveis de forma incremental.

### Resumo
Criar um sistema completo de gestão de equipe com perfis de corretores, RBAC granular com 4 níveis (Admin, Gerente, Corretor, Assistente) e interface visual em Bento Grid seguindo a estética Quiet Luxury.

---

### Parte 1 — Banco de Dados

**Migração 1: Expandir enum `app_role`**
- Adicionar valores `gerente`, `corretor`, `assistente` ao enum `app_role` (atualmente tem `admin`, `moderator`, `user`)

**Migração 2: Criar tabela `team_profiles`**
```text
team_profiles
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users, unique)
├── full_name (text)
├── role_display (text) — cargo exibido (ex: "Corretor Sênior")
├── avatar_url (text)
├── phone (text)
├── creci (text)
├── bio (text) — bio editorial
├── social_instagram (text)
├── social_linkedin (text)
├── availability (text) — 'online' | 'em_visita' | 'offline'
├── is_active (boolean, default true)
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

RLS: Admins podem tudo; membros autenticados podem ler; usuário pode atualizar próprio perfil.

**Migração 3: Criar bucket `team-documents`** no Supabase Storage para upload de documentos (contratos, certidões).

---

### Parte 2 — Frontend: Tela de Equipe (Bento Grid)

**Arquivo: `src/pages/admin/Team.tsx`**
- Header com título "Equipe" + botão "Convidar Membro"
- Bento Grid de cards com:
  - Avatar em alta resolução
  - Nome em Raleway (serifada/semi-bold)
  - Badge de cargo com cores por nível (Admin=bordeaux, Gerente=amber, Corretor=emerald, Assistente=slate)
  - Mini sparkline de leads atendidos na semana (recharts)
  - Indicador de disponibilidade (bolinha verde/amarela/cinza)
- Busca por nome
- Filtro por cargo

**Arquivo: `src/components/admin/team/TeamMemberCard.tsx`**
- Card individual com layout Bento
- Framer Motion para hover e transição

---

### Parte 3 — Frontend: Perfil do Membro (Zen Edit)

**Arquivo: `src/pages/admin/TeamProfile.tsx`**
- Layout minimalista estilo macOS System Settings
- Seções organizadas:
  - **Dados Pessoais**: Avatar (upload com preview), nome, telefone
  - **Dados Profissionais**: CRECI, cargo, bio editorial
  - **Redes Sociais**: Instagram, LinkedIn
  - **Documentos**: Upload de contratos/certidões (Supabase Storage)
  - **Segurança**: Alterar senha, status ativo/inativo
- Shared Element Transition: avatar expande do card para o perfil (Framer Motion `layoutId`)
- Cada alteração gera registro em `system_audit_logs`

---

### Parte 4 — RBAC no Frontend

**Arquivo: `src/hooks/useAuth.ts`** — expandir para retornar role específico (não apenas `isAdmin`)

**Arquivo: `src/components/admin/ProtectedRoute.tsx`** — aceitar prop `allowedRoles` para controle granular

**Lógica de visibilidade por role:**
- **Admin**: Tudo (financeiro, auditoria, configurações, gestão de marca)
- **Gerente**: Leads de toda equipe, relatórios de performance, agenda
- **Corretor**: Apenas seus leads, sua agenda, suas comissões
- **Assistente**: Apenas agenda (leitura) e cadastro de fotos/vídeos

**Arquivo: `src/components/admin/AdminSidebar.tsx`** — filtrar itens do menu conforme role do usuário logado

---

### Parte 5 — Rota e Navegação

- Adicionar item "Equipe" no sidebar (`/admin/equipe`, ícone Users)
- Rotas: `/admin/equipe` (lista) e `/admin/equipe/:id` (perfil)
- Registrar rotas no `App.tsx`

---

### Arquivos a criar/editar

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/admin/Team.tsx` |
| Criar | `src/pages/admin/TeamProfile.tsx` |
| Criar | `src/components/admin/team/TeamMemberCard.tsx` |
| Criar | `src/components/admin/team/InviteMemberDialog.tsx` |
| Editar | `src/hooks/useAuth.ts` — retornar role completo |
| Editar | `src/components/admin/ProtectedRoute.tsx` — suportar `allowedRoles` |
| Editar | `src/components/admin/AdminSidebar.tsx` — filtrar menu por role |
| Editar | `src/App.tsx` — adicionar rotas de equipe |
| Migração | Expandir enum + criar tabela + storage bucket |

### Detalhes Técnicos
- A tabela `team_profiles` se conecta ao `auth.users` via `user_id` (FK com cascade)
- O hook `useAuth` passa a buscar o role do `user_roles` e expor como `role: string` além de `isAdmin: boolean`
- A função `has_role` existente no banco já suporta os novos roles sem alteração
- Sparklines usam dados reais da tabela `leads` (count por `broker_user_id` nos últimos 7 dias, quando houver dados)

