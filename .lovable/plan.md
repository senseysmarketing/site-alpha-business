

## Remover Lenis Smooth Scroll

Remover a inicialização do Lenis em `src/pages/SearchResults.tsx` para restaurar o scroll nativo do navegador.

### Mudança

**`src/pages/SearchResults.tsx`**: Remover o import do Lenis e o `useEffect` que o inicializa (linhas ~3 e ~55-63).

