

## Refinamento Visual do Dashboard Admin — Quiet Luxury

### Arquivos a modificar

**1. `src/components/admin/AdminHeader.tsx`** — Redesign completo
- Glassmorphism: `bg-white/70 backdrop-blur-[12px]` com borda inferior `border-b border-border/30`
- Layout: flex com 3 zonas — esquerda (SidebarTrigger + título da página), centro (barra de busca global), direita (notificações + perfil)
- Alinhamento vertical: `items-center` em todos os elementos
- Barra de busca global centralizada: input minimalista com ícone Search, placeholder "Pesquisar Imóveis ou Leads", bordas suaves, fundo `bg-white/50`
- Título da página dinâmico usando `useLocation` para mapear rotas para nomes (Dashboard, Imóveis, etc.)

**2. `src/components/admin/AdminSidebar.tsx`** — Estado ativo refinado
- Alterar `activeClassName` do NavLink para usar fundo Bordeaux muito claro (`bg-[#2A070C]/5`) com borda esquerda de 3px Bordeaux (`border-l-[3px] border-[#2A070C]`)
- Remover o `bg-muted` atual do estado ativo
- Texto ativo em cor Bordeaux `text-[#2A070C]`

**3. `src/pages/admin/Dashboard.tsx`** — Cores e dados
- Substituir cor dos sparklines: stroke de `hsl(var(--primary))` para `#2A070C` (Midnight Bordeaux)
- Atualizar gradiente do gráfico para usar `#2A070C` com opacidade
- Ícones dos cards: cor `text-[#2A070C]/40` ao invés de `text-muted-foreground/50`

**4. `src/components/admin/AdminLayout.tsx`** — Fundo
- Confirmar fundo `#F8F8F8` (já presente, manter)

### Resultado esperado
Header com glassmorphism e busca centralizada, sidebar com indicador ativo Bordeaux, sparklines em Midnight Bordeaux, visual coeso "Quiet Luxury".

