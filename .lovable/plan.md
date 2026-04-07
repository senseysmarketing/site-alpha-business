

## Ajuste do Rodapé — Adicionar Logo e Links de Navegação

Conforme o print de referência, o footer precisa de uma barra superior com a logo e os links de navegação antes do conteúdo informativo em 2 colunas.

### Mudanças no `src/components/Footer.tsx`

Adicionar uma **linha superior** acima do grid atual contendo:

1. **Logo** (mesma `logo-alpha.png` usada no Header) — à esquerda, com `brightness-0 invert` para ficar branca
2. **Links de navegação** — "Sobre", "Venda", "Locação", "Serviços", "Fale Conosco" — ao centro/direita, estilo uppercase discreto
3. **Botão "Anuncie seu imóvel"** — à direita, similar ao Header

Separador sutil (`border-b border-white/10`) entre a barra de navegação e o conteúdo informativo existente.

**Estrutura:**
```text
┌──────────────────────────────────────────────────┐
│ [LOGO]   Sobre  Venda  Locação  Serviços  Fale   │  Anuncie seu imóvel
├──────────────────────────────────────────────────┤
│ Endereço + Contatos    │  Redes sociais + Legal  │
└──────────────────────────────────────────────────┘
```

**Imports adicionais:** `Link` de react-router-dom, `logoAlpha` de `@/assets/logo-alpha.png`

Os links usarão os mesmos itens do Header (Sobre, Venda, Locação, Serviços, Fale Conosco). O botão "Anuncie seu imóvel" abrirá o `AdvertisePropertyModal`.

