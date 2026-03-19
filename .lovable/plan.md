

## Modulo de Auditoria (Activity Log)

### Passo 1 — Banco de Dados

Criar tabela `system_audit_logs` via migration:

```sql
CREATE TABLE public.system_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL DEFAULT 'Sistema',
  action text NOT NULL,          -- 'criou', 'editou', 'moveu', 'excluiu'
  object_type text NOT NULL,     -- 'imovel', 'lead', 'visita', 'blog_post'
  object_id text,
  object_label text,             -- 'Imóvel AB123', 'Lead Maria Silva'
  old_value text,
  new_value text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: somente admins podem ler/inserir
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON public.system_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit logs"
  ON public.system_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index para queries por data
CREATE INDEX idx_audit_logs_created_at ON public.system_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_object_type ON public.system_audit_logs(object_type);
```

### Passo 2 — Pagina Admin + Rota

| Arquivo | Acao |
|---|---|
| `src/pages/admin/AuditLog.tsx` | **Criar** — Pagina completa com metricas, timeline e filtros |
| `src/components/admin/AdminSidebar.tsx` | **Editar** — Adicionar item "Atividade" com icone `Activity` |
| `src/App.tsx` | **Editar** — Adicionar rota `<Route path="atividade" element={<AuditLog />} />` |

### Passo 3 — Conteudo da Pagina `AuditLog.tsx`

**Topo — Metricas Bento Grid (2 cards):**
- "Acoes nas ultimas 24h" — count query com filtro `created_at > now() - 24h`
- "Alteracoes de Preco Pendentes" — count query filtro `object_type = 'imovel'` e `action = 'editou'` e `metadata->>'field' = 'price'` ultimas 24h

Estilo: cards brancos `bg-white border-border/50 shadow-none`, fontes Raleway para valores, Inter para labels, cor Midnight Bordeaux `#2A070C` nos icones.

**Filtros de Cabecalho:**
- Seletor de Corretor (Select com lista de users distintos dos logs)
- DateRangePicker (Popover + Calendar mode="range", mesmo padrao do Reports.tsx)
- Botao "Exportar CSV" que gera download das atividades filtradas

**Timeline vertical:**
- Lista de cards minimalistas com Avatar (iniciais do usuario), descricao inline: `[Nome] [acao] [objeto] de [valor antigo] para [valor novo]`
- Valores numericos e codigos de imoveis em `font-mono` para precisao
- Badges coloridos por tipo:
  - `💰 Preco` — bg `#2A070C/10` text `#2A070C` (Bordeaux)
  - `👤 Lead` — bg `stone-100` text `stone-600` (Stone Gray)
  - `📅 Visita` — bg `amber-50` text `amber-700` (Gold)
  - `🏠 Imovel` — bg `blue-50` text `blue-700`
  - `📝 Blog` — bg `purple-50` text `purple-700`
- Timestamps com `formatDistanceToNow` em pt-BR
- Paginacao: carregar 50 por vez com botao "Carregar mais"

**Exportacao CSV:**
- Botao no cabecalho que pega os dados filtrados e gera download via `Blob` + `URL.createObjectURL`
- Colunas: Data, Usuario, Acao, Objeto, Valor Antigo, Valor Novo

### Seguranca
- Tabela protegida por RLS (somente admin)
- Rota ja protegida pelo `ProtectedRoute` wrapper que verifica `isAdmin`

