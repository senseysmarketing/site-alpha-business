

## Painel Administrativo Alpha Business

### Nota Importante
Este projeto usa **React + Vite**, não Next.js. As rotas protegidas serão implementadas com React Router DOM + Supabase Auth, não App Router.

### Escopo da Implementação

Esta é uma implementação grande, dividida em blocos:

---

### 1. Database — Tabela `properties`

Criar tabela `properties` via migration com os campos necessários para gestão de imóveis:

```sql
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  property_type text NOT NULL DEFAULT 'casa',
  transaction_type text NOT NULL DEFAULT 'venda',
  condominium text,
  address text,
  city text DEFAULT 'Barueri',
  neighborhood text DEFAULT 'Alphaville',
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  parking_spots integer DEFAULT 0,
  area_total numeric,
  area_built numeric,
  price numeric,
  rental_price numeric,
  status text DEFAULT 'ativo',
  is_featured boolean DEFAULT false,
  engineering_highlights text[],
  photos text[],
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

RLS: leitura pública, escrita apenas admin. Trigger `update_updated_at_column` no update.

Criar bucket `property-photos` para upload de imagens.

---

### 2. Autenticação — Login Admin

**Arquivos novos:**
- `src/pages/AdminLogin.tsx` — Tela de login minimalista (email + senha), estética Quiet Luxury, fundo `#F8F8F8`, logo Alpha Business no topo
- `src/hooks/useAuth.ts` — Hook com `onAuthStateChange` + `getSession`, expõe `user`, `loading`, `isAdmin` (via `has_role` RPC)
- `src/components/admin/ProtectedRoute.tsx` — Wrapper que verifica `isAdmin`, redireciona para `/admin/login` se não autenticado

---

### 3. Layout Shell Admin

**Arquivos novos:**
- `src/components/admin/AdminLayout.tsx` — Layout com `SidebarProvider` do shadcn:
  - **Sidebar retrátil** (collapsible="icon") com menu: Dashboard, Imóveis, Leads, Blog, Configurações
  - **Header fixo** com: `SidebarTrigger`, breadcrumb, avatar do usuário + dropdown (perfil, logout), ícone de notificações (bell)
  - Fundo `#F8F8F8`, bordas `border` de 1px, tipografia Raleway/Inter

---

### 4. Dashboard (Home Admin)

**Arquivo novo:**
- `src/pages/admin/Dashboard.tsx` — Bento Grid com 4 cards principais:
  - **Total de Leads** — contador + mini gráfico de tendência (recharts SparkLine)
  - **Imóveis Ativos** — contador com ícone
  - **Visitas Hoje** — query `visits_scheduling` filtrada por data de hoje
  - **Receita Estimada** — placeholder para futuro
  - Cards com `bg-white`, `border`, `rounded-lg`, sombra sutil
  - Dados reais de `visits_scheduling` e `properties` (quando populada)

---

### 5. Gestão de Imóveis — Lista

**Arquivo novo:**
- `src/pages/admin/Properties.tsx`:
  - Filtros rápidos: chips por condomínio (Residencial 1, 2, Tamboré) + status (Venda/Locação/Todos)
  - Tabela com colunas: Código, Título, Condomínio, Tipo, Preço, Status, Ações
  - Botão "Novo Imóvel" abre wizard
  - Busca por texto

---

### 6. Gestão de Imóveis — Wizard de Cadastro

**Arquivo novo:**
- `src/pages/admin/PropertyForm.tsx` — Formulário multi-abas com shadcn Tabs:
  - **Aba 1 — Dados Básicos**: código, título, tipo (casa/apt/terreno), transação (venda/locação), condomínio, endereço, quartos, banheiros, vagas, área, preço
  - **Aba 2 — Fotos & Vídeos**: Upload drag-and-drop com preview em grid de miniaturas, URL de vídeo tour
  - **Aba 3 — Destaques de Engenharia**: Lista dinâmica de highlights, campo de descrição com botão de microfone (UI simulada — ícone de Mic que mostra toast "Funcionalidade de transcrição será integrada em breve")
  - Campo de descrição com textarea + botão mic ao lado
  - Salva no Supabase via `supabase.from('properties').insert/update`

---

### 7. Rotas

Atualizar `src/App.tsx`:

```
/admin/login → AdminLogin
/admin → ProtectedRoute → AdminLayout
  /admin → Dashboard
  /admin/imoveis → Properties
  /admin/imoveis/novo → PropertyForm
  /admin/imoveis/:id → PropertyForm (edição)
```

---

### Arquivos criados/modificados

| Arquivo | Ação |
|---------|------|
| `src/pages/AdminLogin.tsx` | Novo |
| `src/hooks/useAuth.ts` | Novo |
| `src/components/admin/ProtectedRoute.tsx` | Novo |
| `src/components/admin/AdminLayout.tsx` | Novo |
| `src/components/admin/AdminSidebar.tsx` | Novo |
| `src/components/admin/AdminHeader.tsx` | Novo |
| `src/pages/admin/Dashboard.tsx` | Novo |
| `src/pages/admin/Properties.tsx` | Novo |
| `src/pages/admin/PropertyForm.tsx` | Novo |
| `src/App.tsx` | Modificado (novas rotas) |
| Migration SQL | `properties` table + RLS + storage bucket |

