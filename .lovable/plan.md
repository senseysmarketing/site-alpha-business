## Problema
`normalizeCondoTokens` em `src/lib/condoMatching.ts` descarta tokens de 1 caractere com `t.length > 1`. Isso elimina os números "0".."9" usados nas variantes "Alphaville 0", "Alphaville 1", ..., "Alphaville 9". Consequências:

1. **Agrupamento errado em `useCondoList`**: "Alphaville", "Alphaville 0", "Alphaville 1"... todos viram a mesma assinatura `"alphaville"` e colapsam em uma única entrada na lista canônica.
2. **Filtro errado em `SearchResults`**: `matchCondo("Alphaville 5", "Alphaville 0")` retorna `true` porque o token "0" é jogado fora, sobrando apenas `["alphaville"]`, que está contido em qualquer "Alphaville X".

Por isso `/busca?condominium=Alphaville+0` mostra 234 imóveis (todos os "Alphaville algo") em vez dos 17 reais.

## Mudança

**`src/lib/condoMatching.ts`** — preservar tokens numéricos mesmo com 1 caractere:

```ts
.filter((t) => t && !STOPWORDS.has(t) && (t.length > 1 || /^\d$/.test(t)))
```

Com isso:
- `normalizeCondoTokens("Alphaville 0")` → `["alphaville", "0"]`
- `normalizeCondoTokens("Alphaville 5")` → `["alphaville", "5"]`
- assinaturas distintas → entradas separadas em `useCondoList`
- `matchCondo("Alphaville 5", "Alphaville 0")` → `false` (token "0" não está em `{alphaville, 5}`)
- `matchCondo("Alphaville 0", "Alphaville 0")` → `true` (17 imóveis)

Também mantém o agrupamento por variantes textuais que era o objetivo original ("Jardins de Tamboré" / "Ed. Jardins Tamboré" continuam colapsando, porque só diferem em stopwords).

## Fora de escopo
Não mexer em `SearchResults`, `useCondoList` nem `SearchHero` — o fix de 1 linha em `condoMatching.ts` resolve os dois sintomas.
