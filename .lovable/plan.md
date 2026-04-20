

## Refatorar "Nossas Propriedades" — Layout Editorial

Reformular `NewArrivalsSection.tsx` para espelhar o print de referência: header em uma única linha, cards com card branco completo (imagem + bloco de informações em fundo claro), botão "Saiba Mais" sólido escuro e dots de paginação Bordeaux.

### 1. Header — uma linha só
- Remover o eyebrow "Seleção especial" e a estrutura `flex items-end justify-between` com botões de seta.
- Layout novo: `flex items-center justify-between mb-8`
  - Esquerda: `<h2>` em Noto Serif, texto único "Nossas propriedades especiais em Alphaville, Tamboré e Santana de Parnaiba" (sem `<em>` parcial, sem quebra forçada, peso `font-normal`, tamanho `text-2xl md:text-3xl`).
  - Direita: link "Ver todos" → `/busca`, em Inter, `text-sm`, cor `text-foreground/70 hover:text-primary`, sem ícone.
- Remover completamente os botões circulares de navegação (ChevronLeft/Right) — navegação pelos dots apenas.

### 2. Card de imóvel — card branco completo
Cada slide vira um "card sólido" com borda sutil e sombra leve:
- Wrapper: `bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`
- **Imagem** (topo): `aspect-[4/3]`, sem badges sobrepostos (remover badges "CASA" e código da imagem).
- **Bloco inferior** com padding `p-5`, fundo do card (claro):
  1. **Linha de meta**: tipo à esquerda (`CASA` em uppercase bold pequeno) + código à direita (`CA0523` em muted) — flex justify-between.
  2. **Título** do imóvel em Noto Serif, `text-xl font-normal`, cor foreground.
  3. **Specs** em uma linha separada por traços: `1000m²  -  Suítes: 5  -  Vagas: 5` (texto Inter, `text-sm text-muted-foreground`, sem ícones).
  4. **Divisor** horizontal sutil (`border-t border-border/60 my-4`).
  5. **Footer do card**: flex justify-between alinhado ao centro
     - Esquerda: label "Venda:" (bold pequeno) + preço em BRL `text-lg font-medium` abaixo.
     - Direita: botão "Saiba Mais" sólido — `bg-foreground text-background px-5 py-2 rounded-md text-sm`, hover `bg-foreground/90`. (Substitui o atual outline Bordeaux.)

### 3. Carrossel
- Manter Embla com `align: "start"`, `slidesToScroll: 1`.
- Manter `flex-[0_0_85%] md:flex-[0_0_calc(33.333%-16px)]` — 3 cards visíveis no desktop, 1 no mobile.
- Gap entre cards: `gap-6`.

### 4. Dots de paginação (desktop + mobile)
- Mover dots para **fora do `md:hidden`** — agora visíveis em todos os breakpoints (como no print).
- Estilo: `flex justify-center gap-2 mt-10`.
- Dot ativo: quadrado pequeno Bordeaux com leve arredondamento — `w-6 h-6 rounded-md bg-primary` com um quadrado branco interno (mantém o visual do print: pequeno ícone "ativo" destacado).
  - Implementação simplificada: ativo = `w-7 h-7 rounded-md bg-primary flex items-center justify-center` contendo um `<span className="w-2 h-2 bg-background rounded-sm" />`.
- Dot inativo: `w-2 h-2 rounded-full bg-muted-foreground/30` centralizado verticalmente no mesmo eixo (wrapper `flex items-center` para alinhar visualmente os tamanhos diferentes).

### 5. Limpeza
- Remover imports não utilizados após refatoração: `ChevronLeft`, `ChevronRight`, `Ruler`, `BedDouble`, `Car`, `motion` (se nenhum motion restar).
- Manter lógica de fetch (`useQuery` + fallback `mockProperties`) intacta.
- Manter `formatPrice` para o preço.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/components/NewArrivalsSection.tsx` (refatoração completa do JSX e estilos; lógica de dados preservada) |

### Observações
- Sem mudanças em tokens globais — apenas reorganização visual da seção.
- O botão escuro "Saiba Mais" é uma exceção pontual ao padrão Bordeaux/outline para fidelidade ao print; trata-se de CTA do card, não de botão de navegação principal.
- "Ver todos" leva para `/busca` (página de resultados existente).

