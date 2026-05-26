## Problema

1. Ao clicar em um condomínio no mega menu (ex: "Edifício Chateau"), `/busca?condominium=...` retorna 0 resultados mesmo havendo imóvel cadastrado com esse condomínio. A comparação atual em `SearchResults.tsx` é estrita (`r.condominium !== filters.condominium`), então qualquer diferença sutil (acento NFC/NFD, espaço extra, caixa) zera os resultados.
2. O select "Condomínio" do drawer de Filtros Avançados aparece vazio porque a lista é derivada de `results` em memória — se a busca ainda não retornou (ou veio vazia), o dropdown fica sem opções e o valor pré-selecionado da URL não casa com nenhum item.
3. O campo "Condomínio" do modo Busca Tradicional é um `input` de texto livre, o que também leva a mismatches com a grafia do banco.

## Solução

### 1. Comparação tolerante em `SearchResults.tsx`
- Criar helper `normalizeCondo(s)` (lowercase + `NFD` + remove diacríticos + trim/colapsa espaços) — já existe `normalizeCondoName` em `src/lib/lucideIconMap.ts`, reaproveitar.
- Filtro vira: `normalizeCondo(r.condominium ?? "") !== normalizeCondo(filters.condominium)` quando `filters.condominium !== "all"`.
- Aplicar a mesma normalização no `filteredResults` para qualquer comparação por condomínio.

### 2. Fonte única de condomínios via Supabase
- Em `SearchResults.tsx`, carregar a lista de condomínios diretamente da tabela `condominiums` (ou, como fallback, `select distinct condominium from properties where status='ativo'`) num `useEffect` independente do `results`. Guardar em `allCondos: string[]` ordenado.
- Passar `allCondos` ao `AdvancedFiltersDrawer` no lugar do array derivado de `results`. Assim o dropdown sempre vem populado, mesmo antes da busca terminar.
- Se o valor de `filters.condominium` vier da URL e não bater exatamente com nenhum item, fazer match normalizado e selecionar o item canônico correspondente para exibir corretamente no `Select`.

### 3. Condomínio como `Select` no modo Busca Tradicional
- Em `SearchHero.tsx`, substituir o `<input>` de condomínio por um `<select>` populado com a mesma lista `allCondos` (carregada via prop ou hook compartilhado `useCondoList`).
- Manter "Todos" como opção padrão; ao escolher um item, `handleTraditionalSearch` grava `condominium=<nome canônico>` na URL.

### 4. Pequenos ajustes
- Garantir que ao chegar em `/busca?condominium=X` sem `q`, o fallback de "lista completa" do `SearchResults` continue rodando (já roda) e que `filters.condominium` seja inicializado com o valor da URL (já é) — apenas a comparação normalizada conserta o caso.
- Adicionar `condominium` no `useEffect` que reseta paginação se mudar.

## Arquivos afetados

- `src/pages/SearchResults.tsx` — comparação normalizada, fetch da lista canônica de condomínios, prop para drawer/hero.
- `src/components/search/AdvancedFiltersDrawer.tsx` — usar lista canônica, resolver valor inicial via match normalizado.
- `src/components/search/SearchHero.tsx` — trocar input de condomínio por select com a lista canônica.
- (Opcional) novo hook `src/hooks/useCondoList.ts` para evitar duplicação de fetch entre Hero e SearchResults.

## Fora de escopo

- Mexer no mega menu do Header (já envia `condominium=<nome canônico do banco>`).
- Mudar comportamento da busca cognitiva (IA).
