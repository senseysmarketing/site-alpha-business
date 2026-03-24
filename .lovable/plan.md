

## Refinamento Visual do Painel de Resultados da Busca

### Problema
1. Chips duplicados — aparecem tanto no HeroSection (abaixo da barra) quanto dentro do SearchResultsPanel
2. Todos os resultados exibidos sem limite
3. Placeholder "Sem foto" texto simples, sem sofisticacao
4. Painel sem glassmorphism intenso
5. Cards sem animacao staggered nem hover refinado

### Mudancas

**`src/components/SearchResultsPanel.tsx`** — Reescrever

- **Remover chips duplicados**: Remover o bloco `FilterChips` de dentro do painel (ja aparece no HeroSection acima)
- **Limitar a 4 resultados**: `results.slice(0, 4)` no render
- **Glassmorphism intenso**: Trocar `glass-panel` por `bg-background/60 backdrop-blur-[20px] border border-border/30 shadow-2xl`
- **Placeholder sem foto**: Substituir texto "Sem foto" por icone `Building2` do lucide (strokeWidth 1, cor muted) centralizado
- **Hover nos cards**: `hover:bg-foreground/[0.03]` + icone `ArrowRight` em bordeaux `text-[#2A070C]` que aparece no hover (opacity 0 → 1)
- **Staggered fade-in**: Cada card com `motion.button` e `initial/animate` com delay `i * 0.08`
- **Contador**: `text-[9px] tracking-[0.2em] uppercase` mais elegante
- **"Ver todos"**: Mover para o final (abaixo dos resultados), estilo mais proeminente com tracking largo e seta

**`src/components/HeroSection.tsx`** — Sem mudanca necessaria (chips ja estao fora do painel)

### Resultado
Painel com no maximo 4 imoveis, glassmorphism forte, icone arquitetonico no placeholder, hover com seta bordeaux, animacao staggered, sem chips duplicados.

