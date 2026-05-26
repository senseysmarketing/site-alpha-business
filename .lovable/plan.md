## Causa raiz

O carregamento inicial de `/busca` (sem `q`) faz `select ... limit(200)` em `properties`. Existem 729 imóveis ativos, então qualquer imóvel fora do top 200 (ordenado por `is_featured desc, created_at desc`) nunca chega ao filtro client-side — é o caso do AP0144 (Edifício Chateau). A normalização que adicionamos está correta, mas não tem efeito porque o item nem sequer está na lista.

## Correção

Em `src/pages/SearchResults.tsx`, no `useEffect` que carrega a lista quando não há `q`:

1. Ler `condominium` e `transactionType` da URL.
2. Resolver o `condominium` para o nome canônico (via `useCondoList` / `resolveCanonicalCondo`) — fazer o fetch numa função que aguarda a lista canônica antes de consultar, ou aplicar `.ilike("condominium", value)` para tolerar variações.
3. Montar a query com `.eq("condominium", canonical)` (ou `.ilike`) e `.eq("transaction_type", tx)` quando aplicável.
4. Manter `limit(500)` para o caso geral (sem filtro), suficiente para a base atual de 729.
5. Re-executar o fetch quando `searchParams` mudar (condominium/transactionType).

Resultado: ao chegar em `/busca?condominium=Edifício+Chateau`, o Supabase já devolve apenas os imóveis daquele condomínio, garantindo que o AP0144 (e quaisquer outros fora do top 200) apareçam.

## Fora de escopo

- Não mexer no SearchHero/mega menu.
- Não mudar busca cognitiva (IA) — só o caminho "sem q".
