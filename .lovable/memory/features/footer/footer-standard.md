---
name: Footer Standard
description: Rodapé em paleta clara (cinza arquitetônico) com logo Rafael, botão dark arredondado e textos foreground/muted
type: feature
---
O rodapé (`Footer.tsx`) usa fundo `bg-muted/50` (cinza arquitetônico padrão do site, alinhado ao admin) com textos em `text-foreground/80` e tons `text-muted-foreground` para informações secundárias. Borda divisória usa `border-border`.

**Logo**: usa `logo-rafael.png` (mesma do Header) em `h-8 md:h-10 w-auto`, sem filtros CSS — identidade unificada entre topo e rodapé.

**Estrutura**: barra superior com logo + nav (5 links em uppercase tracking-widest) + botão "Anuncie seu imóvel" no padrão dark `bg-foreground text-background rounded-md` (size sm, text-xs uppercase). Abaixo, grid 2 colunas: esquerda com endereço institucional e WhatsApps; direita com handles do Instagram, copyright, texto institucional SEO e CRECI-PJ.

Telefones em formato BR `(XX) XXXXX-XXXX`. Handles IG prefixados com `@`. Modal `AdvertisePropertyModal` aciona o lead capture via botão.
