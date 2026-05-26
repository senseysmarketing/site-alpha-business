Trocar o batch inicial e o incremento de "Ver mais imóveis" de 8 → 9 em `src/pages/SearchResults.tsx`:
- linha 74: `useState(8)` → `useState(9)`
- linha 156: `setVisibleCount(8)` → `setVisibleCount(9)`
- linha 292: `c + 8` → `c + 9`

Com isso o grid 3×3 fica sempre completo (mobile 1 col / tablet 2 cols continuam OK, pois 9 é divisível em ambas com no máx. 1 sobra).