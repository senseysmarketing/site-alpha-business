## Diagnóstico

**Bug 1 — slider com uma bolinha só**
`src/components/ui/slider.tsx` renderiza apenas um `<SliderPrimitive.Thumb />`. Radix cria um thumb por valor do array — como só existe um `Thumb` no JSX, mesmo passando `value={[min, max]}` a segunda bolinha nunca aparece. Afeta todos os range sliders (Faixa de Preço, Faixa de Aluguel, Área).

**Bug 2 — filtro corta imóveis caros legítimos**
Em `SearchResults.tsx` a função `percentileCap(values, 0.98)` é usada para calcular `saleMax`/`rentMax` (~linha 362) e esse mesmo valor vira o **filtro ativo** (`priceRange` inicializado com `bounds.saleRange`). Resultado: uma casa legítima de R$ 80M fica fora do resultado quando o pool tem 519 imóveis (p98 ≈ R$ 44M), mas reaparece quando o pool encolhe para 128 imóveis (5+ suítes). Como `sortBy=price_desc` só mostra os primeiros 9, a "mansão" nunca aparece.

## Dinamismo dos limites — sim, e já é assim (com um ajuste)

O `bounds` já é calculado a partir de `nonRangeFiltered`, ou seja, o subconjunto de imóveis após aplicar **todos os filtros não-range** (condomínio, cidade, bairro, tipo, transação, quartos, banheiros, vagas, featured). Então:

- `/busca?condominium=Tamboré+1` → slider mostra o mínimo e máximo **do Tamboré 1**.
- `/busca?transactionType=venda&propertyType=casa` → slider mostra min/max **das casas à venda**.
- Se o usuário mudar tipo/condomínio, os limites (e o range ativo, quando ainda estava colado nos limites) recalculam automaticamente.

Isso é preservado. O único ajuste é **como** o min/max são calculados: hoje é o percentil 98, passamos a usar o min/max **real** do subconjunto atual.

## Correções

### 1. `src/components/ui/slider.tsx`
Renderizar um Thumb por valor:
```tsx
{(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
  <SliderPrimitive.Thumb key={i} className="..." />
))}
```
Corrige as duas bolinhas em todos os sliders do site sem tocar em cada consumidor.

### 2. `src/pages/SearchResults.tsx` — bounds reais, cap só para o step
- Trocar `percentileCap` por `Math.max(...)`/`Math.min(...)` reais do subconjunto `nonRangeFiltered` para `saleRange`, `rentRange` e `areaRange`.
- Manter o `percentileCap` **apenas** para calcular o `step` do slider no `AdvancedFiltersDrawer` (evita passos absurdos quando existe um outlier no cadastro). O `step` fica em `AdvancedFiltersDrawer.tsx` e já é derivado do range, então basta manter a lógica atual lá.
- Arredondar min para baixo e max para cima em unidades sensatas (R$ 50.000 para venda, R$ 500 para aluguel, 10 m² para área) para o slider ficar "limpo".
- A dependência de `nonRangeFiltered` garante que o range é **contextual** ao filtro atual (Tamboré 1, casa venda, etc.).

### 3. Reset automático quando o range ativo estava colado nos limites
Se o usuário não mexeu no slider (`priceRange` == `bounds.saleRange` anterior), quando os bounds recalcularem por causa de outro filtro, o `priceRange` acompanha os novos limites — assim o 80M passa a ser incluído automaticamente sem pedir para o usuário mexer no slider. Se o usuário já customizou o range, respeitamos a escolha dele (só clampamos aos novos limites).

### 4. Verificação
- `/busca?transactionType=venda&propertyType=casa` → slider duas bolinhas, max = preço real da casa mais cara, card de R$ 80M aparece como primeiro resultado.
- `/busca?condominium=Tamboré+1` → slider vai do menor ao maior preço do Tamboré 1, não do catálogo inteiro.
- `/busca?transactionType=locacao` → slider de aluguel usa min/max reais do pool de locação.

Sem alterações em schema, RPCs ou outras telas.
