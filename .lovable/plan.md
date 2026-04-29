## Objetivo
Adicionar o toggle **Cognitivo / Busca Tradicional** ao campo de busca da página de resultados (`/busca`), igualando-o à barra da home.

## Mudanças

### `src/components/search/SearchHero.tsx`
- Largura do container: `max-w-2xl` → `max-w-3xl` para acomodar a grade de filtros tradicionais.
- Envolver a barra de busca num cartão `bg-background rounded-lg shadow-xl p-4 md:p-6` (mesmo estilo do `SearchBarSection` da home), substituindo o `glass-panel` atual.
- Adicionar estado `mode: "cognitive" | "traditional"` (default `"cognitive"`) e um toggle pill (`bg-muted rounded-full`) acima do campo, idêntico ao da home.
- **Modo Cognitivo**: mantém o input atual (mic + ícone Search + input + botão Buscar), os chips de filtros parsed e as pills de lifestyle abaixo. Pequeno polish para o botão Buscar ficar inline (alinhado com o estilo da home), removendo a sobreposição absoluta.
- **Modo Tradicional**: replica o painel da `SearchBarSection`:
  - Grid `grid-cols-2 md:grid-cols-3 gap-3` com selects: **Transação** (Venda/Locação), **Tipo** (Casa/Apto/Terreno), **Nº Quartos** (1/2/3/4+), **Preço mínimo**, **Até**, **Condomínio** (input texto).
  - Estado inicial dos filtros lê `searchParams` (`condominium`, `transactionType`) para refletir o que veio dos links do Header/Footer.
  - Botão **Buscar imóveis** chama `handleTraditionalSearch`: monta `URLSearchParams` (condominium, transactionType, q derivada das partes), aplica via `setSearchParams(next)` e dispara `handleSearch(q)` quando há termos. Sem termos, limpa results para acionar o fallback de "lista completa" já existente em `SearchResults`.
- Pills de lifestyle só aparecem no modo Cognitivo. Clicar numa pill volta para Cognitivo e dispara a busca.

### Sem mudanças em `SearchResults.tsx`
Já lê `condominium` e `transactionType` do `searchParams` no estado inicial dos filtros e usa o fallback de lista completa quando não há `q`. O novo handler tradicional reaproveita esse contrato.

### Memória
Atualizar `mem://features/search/results-layout` para registrar que o hero da `/busca` agora tem o mesmo cartão e o toggle Cognitivo/Tradicional do hero da home, com filtros tradicionais sincronizados via URL.

## Resultado esperado
O usuário em `/busca` vê o mesmo padrão de campo de pesquisa da home, podendo alternar entre IA e filtros tradicionais sem sair da página, com a URL refletindo os filtros aplicados.