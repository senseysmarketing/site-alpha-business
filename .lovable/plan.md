

## Redesign da LifestyleSection — Layout de Cards Limpos

Conforme o print de referência, os cards de lifestyle devem seguir um estilo clean: imagem em cima, título embaixo fora da imagem, sem overlay escuro, sem botão "Explorar", sem contagem de imóveis.

### Mudanças no `src/components/LifestyleSection.tsx`

**Layout do card:**
- Imagem no topo com aspect ratio ~4:3, `rounded-sm`, sem overlay gradiente
- Título abaixo da imagem em texto escuro (`text-foreground`), fora do card de imagem
- Remover: gradient overlay, botão "Explorar", contagem de imóveis, subtitle

**Títulos atualizados conforme print:**
- "Refúgios para relaxar" (era "Imóveis para relaxar")
- "Imóveis Assinados" (mantém)
- "Mais espaço para a família" (mantém)

**Remover label "Lifestyle"** acima do título principal

**Título principal:** manter "Encontre propriedades que representam seu **estilo de vida**" com "estilo de vida" em bold (não italic), conforme print

**Estrutura do card:**
```text
┌─────────────────────┐
│                     │
│      [IMAGEM]       │
│                     │
└─────────────────────┘
  Refúgios para relaxar
```

**Manter:** carrossel Embla, dots de navegação, setas desktop, responsividade mobile

