
## Ajustar Fontes da Tela de Busca

### Problema
Os cards de imoveis na busca usam `text-serif` (Cormorant Garamond) nos titulos, enquanto o restante do site usa `text-display` (Raleway). Isso cria inconsistencia visual.

### Mudanca

**`src/components/search/PropertyCard.tsx`**:
- Linha 93: Trocar `text-serif` por `text-display` no titulo do imovel (h3)
- Linha 107, 113, 119: Trocar `font-mono` por `text-body` nas specs (m², quartos, banheiros) para consistencia com o padrao Inter usado no resto do site

**`src/components/search/ConciergeSidebar.tsx`**:
- Linha onde aparece `text-serif` no titulo da sugestao: Trocar por `text-display`

Resultado: todos os titulos usarao Raleway (`text-display`) e dados tecnicos usarao Inter (`text-body`), igual a homepage.
