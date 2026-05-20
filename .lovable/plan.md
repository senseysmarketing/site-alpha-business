## Ajustes estéticos

### 1. Espaçamento do título do Hero
Em `src/components/HeroSection.tsx` (h1 do hero, ~linha 158-163), o `line-height` atual é `1.5` (`!leading-[1.5]` + `style={{ lineHeight: 1.5 }}`), o que ficou folgado demais. Reduzir para `1.15` — espaço suficiente para não encostar nas linhas (descendentes do "g/p/y" + acentos) sem parecer arejado demais. Mesma alteração no `FeaturedPropertySection.tsx` (linha ~58) e `BlogHero.tsx` (já está em `1.1`, OK) se quisermos consistência total — proponho aplicar apenas no Hero principal por enquanto, conforme o pedido.

### 2. "Fale Conosco" → "Contato" no cabeçalho
Em `src/components/Header.tsx`:
- Linha 85 (array `navItems`, não usado para render direto mas mantido por consistência).
- Linha 222 (desktop) e linha 310 (mobile): trocar label `"Fale Conosco"` por `"Contato"`.
- O `hash="contato"` permanece (já aponta para o id correto da `ContactSection`).
- Atualizar a memória `features/header/navigation.md` para refletir o novo label.

### 3. Otimização para tablet
**Diagnóstico**: o header usa `hidden lg:flex` para o menu desktop, ou seja, em tablet (768–1023px) só aparecem a logo + hambúrguer. A logo está em `h-8 md:h-10` — visualmente fica pequena/"perdida" no espaço maior do tablet, dando a sensação de "espremida" em relação ao padding `md:px-12`.

**Ajustes propostos**:
- `Header.tsx` linha 144: logo `h-8 md:h-11 lg:h-10` — tablet ganha um tamanho dedicado, ligeiramente maior, equilibrando o espaço horizontal.
- `Header.tsx` linha 139: padding do header em tablet `px-6 md:px-10 lg:px-24` (reduzir um pouco o `md:px-12` para dar mais respiro visual à logo sem deixá-la colada na borda).
- Avaliar breakpoint do menu: manter `lg:` (hambúrguer em tablet) — não mexer no comportamento, só na proporção visual.

**Demais seções do site (revisão pontual de tablet)**:
- `HeroSection.tsx`: o título usa `text-3xl md:text-5xl lg:text-6xl`. Em tablet (768–1023) ele fica em `text-5xl`, que combina bem com a altura `md:h-[80vh]`. Sem ajuste necessário.
- `FeaturedPropertySection.tsx`: grid `md:grid-cols-2` ativa em tablet — funciona, sem ajuste.
- Padronizar o padding lateral global de tablet: a maioria das seções já usa `px-6 md:px-12 lg:px-24`. Não vamos mudar todas (escopo grande); apenas o `Header` se beneficia do ajuste fino.

### Resumo das edições
- `src/components/HeroSection.tsx` — line-height do h1: `1.5` → `1.15`.
- `src/components/Header.tsx` — label "Fale Conosco" → "Contato" (2 lugares + array), logo `md:h-11`, padding `md:px-10`.
- `.lovable/memory/features/header/navigation.md` — atualizar label.

Sem alterações de comportamento/rota.