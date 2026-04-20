

## Reduzir "Imóveis que você também pode gostar" para 3 Cards

Diminuir de 4 para 3 cards na seção de imóveis similares na página de detalhes, dando mais respiro às informações de cada card.

### Mudanças em `src/pages/PropertyDetail.tsx`

1. **Slice dos similares**: trocar `.slice(0, 4)` por `.slice(0, 3)`.
2. **Grid responsivo**: trocar `lg:grid-cols-4` por `lg:grid-cols-3` (mobile/tablet permanecem `grid-cols-1 md:grid-cols-2`... ajuste para `md:grid-cols-3` direto no breakpoint médio para já mostrar os 3 lado a lado em telas md+).

Resultado final do grid: `grid grid-cols-1 md:grid-cols-3 gap-6`.

### Observações

- Sem alterações no markup interno dos cards — apenas quantidade e colunas.
- Mantém a identidade visual já alinhada com a home.

