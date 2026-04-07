

## Ajuste da LifestyleSection — Posição e Padrão Visual

### Problemas identificados
1. **Posição errada**: Está após o banner "Conheça os Condomínios" (FeaturedPropertySection). Deve ficar entre os cards de imóveis (NewArrivalsSection) e o banner
2. **Largura inconsistente**: Usa `px-6 md:px-12 lg:px-24` enquanto o restante do site usa `max-w-7xl mx-auto` com `section-padding`
3. **Botões de navegação**: Usa chevrons flutuantes com hover-reveal; deveria usar os botões quadrados com borda igual à seção de imóveis

### Mudanças

**`src/pages/Index.tsx`** — Trocar a ordem:
- Mover `<LifestyleSection />` para **antes** de `<FeaturedPropertySection />`

**`src/components/LifestyleSection.tsx`** — Alinhar ao padrão visual:
- Envolver conteúdo em `section-padding` + `max-w-7xl mx-auto` (igual NewArrivalsSection)
- Trocar botões de navegação flutuantes por botões quadrados com borda (`w-10 h-10 border border-border rounded-md`) posicionados ao lado do título, igual à seção de imóveis
- Remover dots de navegação no desktop (manter apenas no mobile)
- Remover `group` da section e o hover-reveal dos botões
- Ajustar carousel para usar `overflow-hidden` sem padding lateral extra

