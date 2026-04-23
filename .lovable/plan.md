

## Cabeçalho Adaptativo + Espaçamento do Hero de Busca

Dois ajustes para a página `/busca` (e qualquer outra com fundo claro no topo).

### 1. Cabeçalho com fundo claro nas páginas internas

Hoje o `Header` é transparente até dar scroll, e só fica escuro (Bordeaux) quando rola. Em páginas com **fundo claro no topo** (como `/busca`), o logo branco e os links brancos ficam invisíveis sobre o off-white.

**Solução: variante "solid" do Header acionada por prop.**

- Em `src/components/Header.tsx`: aceitar prop `variant?: "transparent" | "solid"` (default `"transparent"` mantém comportamento atual da home).
- Quando `variant="solid"`: header já inicia com fundo Bordeaux (`bg-[#1f1f1f]/95 backdrop-blur-md`) desde o topo, sem depender de scroll. Logo, links e botão "Anuncie seu imóvel" continuam brancos sobre o fundo escuro — mesma estética do header pós-scroll da home, garantindo legibilidade imediata.
- Em `src/pages/SearchResults.tsx`: usar `<Header variant="solid" />`.
- Comportamento de `scrolled` continua funcionando (idempotente quando já está sólido).

**Por que essa alternativa**: mantém consistência visual com o restante do site (mesmo header escuro que aparece quando o usuário rola), evita inventar nova paleta, e resolve o problema sem mexer em fundo/tipografia da página.

### 2. Espaçamento entre Header e título "Alpha Concierge"

O Header é `fixed` (h ~64px) e o `SearchHero` usa `py-12 md:py-16` — o título encosta visualmente no header porque não há padding-top que compense a altura fixa do cabeçalho.

**Ajuste em `src/components/search/SearchHero.tsx`**:

- Trocar `py-12 md:py-16` → `pt-28 md:pt-32 pb-10 md:pb-12`.
- `pt-28` (~7rem) = ~64px do header + ~48px de respiro real acima do título.
- Reduzir `pb` para manter a distância curta até a barra de busca/resultados (que já foi otimizada na iteração anterior).

### Resultado

- `/busca`: header Bordeaux desde o topo, totalmente legível sobre o fundo claro.
- Home (`/`) e Property Detail continuam com header transparente sobre o hero.
- Título "Alpha Concierge" com respiro adequado em relação ao cabeçalho fixo.

### Arquivos editados

- `src/components/Header.tsx` (adicionar prop `variant`)
- `src/pages/SearchResults.tsx` (passar `variant="solid"`)
- `src/components/search/SearchHero.tsx` (ajustar padding-top)
- `mem://features/header/navigation` (registrar variante solid)

