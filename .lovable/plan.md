

## Refatorar "Nossa Equipe" — Header em 1 Linha + Dots Bordeaux

Alinhar `TeamSection.tsx` ao mesmo padrão editorial das seções "Nossas Propriedades", "Lifestyle" e "Redes Sociais".

### 1. Header — uma linha só

Substituir o bloco atual (`flex items-end justify-between` com eyebrow "Quem somos" + título grande + botões circulares de navegação) por:

- `flex items-center justify-between mb-10`
  - Esquerda: `<h2>` em Noto Serif, `text-2xl md:text-3xl font-normal text-foreground` — texto: `Nossa Equipe` (sem eyebrow, sem `<strong>` parcial, sem display gigante).
  - Direita: link "Ver todos" → `/equipe` (ou `#contato` como fallback se a rota não existir; usaremos `#contato` para manter seguro), em Inter `text-sm text-foreground/70 hover:text-primary transition-colors`.
- Remover botões `ChevronLeft`/`ChevronRight` (navegação fica só pelos dots, como nas outras seções).

### 2. Cards — manter visual circular do print

O print mostra exatamente o que já temos: avatar circular grande + nome + cargo centralizados, **sem** wrapper de card branco (diferente das seções de imóveis/lifestyle). Manter:

- `flex flex-col items-center text-center`
- Avatar circular: aumentar levemente para `w-32 h-32 md:w-36 md:h-36` (mais próximo do print, hoje está 24/28).
- Nome: Noto Serif (`text-display`), `text-base font-normal text-foreground mb-1`.
- Cargo: Inter, `text-sm text-muted-foreground`.
- Slides: `flex-[0_0_50%] md:flex-[0_0_25%]` (4 visíveis no desktop como no print, 2 no mobile).
- Gap: `gap-8`.

### 3. Dots de paginação — padrão Bordeaux unificado

Substituir os dots atuais (estilo pill alongado) pelo mesmo padrão das outras seções:
- Container: `flex items-center justify-center gap-2 mt-10` (visível em todos os breakpoints, remover o `md:hidden`).
- Ativo: `w-7 h-7 rounded-md bg-primary flex items-center justify-center` com `<span className="w-2 h-2 bg-background rounded-sm" />` interno.
- Inativo: `w-2 h-2 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors`.
- Usar `emblaApi.scrollSnapList()` para refletir snaps reais (com `containScroll: trimSnaps`), em vez de `members.length`.

### 4. Limpeza

- Remover imports não usados: `ChevronLeft`, `ChevronRight`.
- Manter `useSiteSettings`, `defaultTeam` fallback e animações framer-motion.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/components/TeamSection.tsx` (header em 1 linha, avatares maiores, dots Bordeaux unificados) |
| Atualizar | `mem://features/team/layout-carousel` (refletir novo padrão de header + dots) |

### Observações

- Sem mudanças em tokens globais.
- Cards mantêm formato circular limpo (sem wrapper branco) — é o padrão correto para apresentação de pessoas, distinto dos cards de imóveis/categorias.
- Dots agora 100% consistentes em todas as 4 seções do home (Propriedades, Lifestyle, Redes Sociais, Equipe).

