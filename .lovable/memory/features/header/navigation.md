---
name: Header & Navigation
description: Header transparente que vira escuro ao rolar, menu enxuto com destinos reais e âncora cross-page para contato
type: feature
---
**Variantes**: `transparent` (padrão, hero overlap) → fica `bg-[#1f1f1f]/95 backdrop-blur-md` quando `scrollY > 50` ou o menu mobile abre. Z-index `z-50`.

**Itens do menu** (header e mobile):
- Venda → `/busca?transactionType=venda`
- Locação → `/busca?transactionType=locacao`
- Notícias → `/blog`
- Contato → âncora `#contato` (id real da `ContactSection`)

Itens removidos: Buscar, Serviços, Sobre. NÃO reintroduzir sem rota/seção real.

**CTA**: botão "Anuncie seu imóvel" (pill `rounded-full border-white/30`) abre `AdvertisePropertyModal`.

**Cross-page anchor**: o handler de Fale Conosco verifica `location.pathname`. Na home, `scrollIntoView({behavior:"smooth"})`. Em outras rotas, `navigate("/#contato")` e `Index.tsx` lê `location.hash` em `useEffect` (após `loaded`) para rolar até o elemento. Replicar esse padrão em qualquer novo link âncora cross-page.

**Tipografia**: `text-xs tracking-[0.15em] uppercase`, fonte Roboto inline.
