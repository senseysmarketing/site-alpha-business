---
name: Footer Standard
description: Rodapé escuro com logo Rafael, nav enxuto com destinos reais e CTA Anuncie seu imóvel
type: feature
---
O rodapé (`Footer.tsx`) usa fundo `bg-accent` com textos em `text-white/60` a `text-white`. Borda divisória `border-white/10`.

**Logo**: `logo-rafael.png` (mesma do Header) em `h-8 md:h-10 w-auto`, sem filtros — identidade unificada.

**Nav** (4 itens, uppercase tracking-widest): Venda → `/busca?transactionType=venda`, Locação → `/busca?transactionType=locacao`, Notícias → `/blog`, Fale Conosco → âncora `#contato` (mesmo handler cross-page do Header: scroll suave na home, `navigate("/#contato")` em outras rotas). Itens removidos: Sobre, Serviços. Não reintroduzir sem destino real.

Telefones em formato BR `(XX) XXXXX-XXXX`. Handles IG prefixados com `@`. Modal `AdvertisePropertyModal` aciona o lead capture via botão.
