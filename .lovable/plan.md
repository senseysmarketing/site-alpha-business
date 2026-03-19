

## Modulo de Identidade e Marca (Identity Control)

### Passo 1 — Banco de Dados

Criar tabela `site_settings` via migration:

```sql
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_settings"
  ON public.site_settings FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can update site_settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed initial settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"video_url": "", "fallback_image": "", "title": "Viver é uma arte.", "subtitle": "Encontre sua obra-prima em Alphaville."}'::jsonb),
  ('design_tokens', '{"accent_color": "#2A070C", "background_color": "#F5F0EB", "secondary_color": "#8B7D6B"}'::jsonb),
  ('featured_property', '{"property_id": "", "custom_label": "Destaque"}'::jsonb),
  ('lifestyle_categories', '{"categories": [{"title": "Mansões Modernas", "subtitle": "Arquitetura contemporânea", "image": ""}, {"title": "Vida em Família", "subtitle": "Residenciais completos", "image": ""}, {"title": "Refúgios Sustentáveis", "subtitle": "Luxo e natureza", "image": ""}]}'::jsonb),
  ('team', '{"members": [{"name": "Wilson Roberto", "role": "CEO & Fundador", "creci": "", "photo": ""}, {"name": "Rafael Albuquerque", "role": "Diretor Comercial", "creci": "", "photo": ""}]}'::jsonb),
  ('contact', '{"phone": "", "email": "", "instagram": "", "address": ""}'::jsonb),
  ('footer', '{"copyright_text": "Alpha Business © 2025", "tagline": ""}'::jsonb);
```

### Passo 2 — Rota e Navegacao

| Arquivo | Acao |
|---|---|
| `src/pages/admin/SiteSettings.tsx` | **Criar** — Pagina principal com bento grid |
| `src/App.tsx` | **Editar** — Adicionar rota `configuracoes` |
| `src/components/admin/AdminSidebar.tsx` | Ja tem "Configuracoes" no menu, URL `/admin/configuracoes` |

### Passo 3 — Layout Bento Hub (7 Blocos)

A pagina `SiteSettings.tsx` sera organizada em blocos modulares:

**Bloco 1 — Homepage Hero**
- Campo de texto para URL de video 4K
- Upload de imagem fallback (drag-and-drop para bucket `property-photos`)
- Campos de titulo e subtitulo editaveis

**Bloco 2 — Design System (Tokens)**
- Color pickers para: Cor de Acento (--accent, default #2A070C), Cor de Fundo (--background), Cor Secundaria
- Preview em tempo real: ao alterar cor, atualiza CSS custom properties no DOM instantaneamente
- Botao "Resetar Padrao" para voltar aos valores originais

**Bloco 3 — Imovel de Destaque**
- Select com lista de imoveis da tabela `properties` para escolher qual aparece na FeaturedPropertySection
- Campo de label customizado ("Destaque", "Exclusivo", etc.)

**Bloco 4 — Categorias de Lifestyle**
- Grid editavel das 3 categorias ("Navegue pelo seu estilo de vida")
- Campos: titulo, subtitulo, imagem (upload)
- Possibilidade de reordenar

**Bloco 5 — Equipe / Socios**
- Grid com cards dos socios (Wilson Roberto, Rafael Albuquerque)
- Campos: nome, cargo, CRECI, foto (drag-and-drop upload)
- Botao para adicionar novo membro

**Bloco 6 — Contato e Redes**
- Campos: telefone, email, Instagram, endereco

**Bloco 7 — Rodape**
- Texto de copyright, tagline

### Passo 4 — Mini Preview

No lado direito da tela (layout 2/3 + 1/3 em desktop), um painel fixo "Mini Preview" com:
- Iframe ou componente estilizado mostrando uma versao simplificada da homepage
- Atualiza em tempo real conforme o admin edita cores, video e textos
- Escala reduzida (transform: scale(0.4)) dentro de um card com borda fina

### Passo 5 — Persistencia e Propagacao

- Cada bloco tem botao "Salvar" que faz upsert na tabela `site_settings`
- Ao salvar, insere registro no `system_audit_logs` com a mudanca
- Hook `useSiteSettings(key)` para consumir as settings no frontend publico, substituindo valores hardcoded gradualmente
- React Query com `staleTime: 0` para que mudancas sejam refletidas rapidamente

### Estetica

- Cards brancos `bg-white border-border/50 shadow-none rounded-sm`
- Fontes: Raleway para titulos dos blocos, Inter para labels e campos
- Color pickers usando `<input type="color">` estilizado com borda fina
- Glassmorphism sutil nos modais de confirmacao (`bg-white/70 backdrop-blur-xl`)
- Muito espaco negativo entre blocos

### Arquivos a criar/editar

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `site_settings` + seed |
| `src/pages/admin/SiteSettings.tsx` | Criar pagina completa |
| `src/hooks/useSiteSettings.ts` | Criar hook reutilizavel |
| `src/App.tsx` | Adicionar rota `configuracoes` |

