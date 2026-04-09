

## Corrigir imagens ausentes nos resultados de busca

### Causa raiz
A edge function `ai-property-search` retorna `photo: prop.photos?.[0] || null` (linha 220). Como os imóveis no Supabase não têm fotos cadastradas no campo `photos`, o `photo` chega como `null` e os cards exibem "SEM FOTO".

Na homepage, o `NewArrivalsSection` resolve isso com um fallback: `p.photos?.[0] || mockByCode[p.code] || "/images/property-1.jpg"` — mapeando o código do imóvel para a imagem mockada correspondente.

### Solução
Aplicar a mesma estratégia de fallback no `SearchResults.tsx`:

1. **`src/pages/SearchResults.tsx`**: Após receber os resultados (tanto do `onResults` quanto do estado inicial), enriquecer cada resultado com fallback de imagem usando `mockByCode` — se `photo` for null, buscar pela correspondência de código nos mockProperties, senão usar uma imagem padrão.

2. **`src/components/search/SearchHero.tsx`**: Aplicar o mesmo fallback ao montar os resultados da edge function (linhas 89-100) — antes de chamar `onResults`, mapear cada resultado e preencher `photo` com o fallback dos mockProperties quando vier null.

### Arquivos a editar
- `src/components/search/SearchHero.tsx` — adicionar fallback de `photo` usando `mockByCode` nos resultados da AI e nos fallbacks locais
