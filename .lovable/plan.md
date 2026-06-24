
## Diagnóstico

Olhando o log e o print da conversa "quero imoveis na granja viana":

1. **Falso "atendemos apenas Alphaville/Tamboré"** — está hard-coded no system prompt do `extractSearchIntentV3` (linha 1865 de `supabase/functions/ai-property-search/index.ts`). Mas o banco tem imóveis em Granja Viana, Cotia etc. (ex.: CG0001, CG0002). O LLM devolveu `filters_patch: {}` e o `countMatches` rodou sem filtro → 777 (todos os ativos), por isso o painel mostrou "777 imóveis encontrados" + chips aleatórios (Alphaville 1, Burle Marx, Tamboré 2).
2. **Sem detecção de bairro/cidade no parser determinístico** — só há regex de condomínio (`tambore|alphaville|residencial \d+`). "Granja Viana", "Alphaville (bairro)", "Tamboré (bairro)", "Cotia", "Barueri", "Santana de Parnaíba" não são reconhecidos.
3. **Ambiguidade bairro vs condomínio** — "alphaville" sozinho hoje vira `condominiumGroup: "Alphaville"` e abre chips de condomínios; nunca pergunta se o usuário quer **o bairro inteiro** (todos os condomínios + ruas abertas).
4. **Endereço (`address`) não entra como filtro** — só aparece no `textBlob` da busca interna; o LLM não sabe que pode usá-lo.

## Objetivo

Tornar a Rafa IA capaz de:
- Reconhecer **bairro** e **cidade** de qualquer imóvel cadastrado (não só Alphaville/Tamboré).
- Distinguir claramente quando o usuário fala de **bairro** ("Alphaville", "Tamboré", "Granja Viana") vs **condomínio** ("Alphaville 1", "Tamboré 2", "Burle Marx").
- Conversar antes de assumir: quando o termo for ambíguo, perguntar com chips.
- Filtrar por trecho de endereço/rua quando o usuário citar.

## Mudanças

### 1. Índice dinâmico de localidades (`supabase/functions/ai-property-search/index.ts`)

Hoje existe `loadCondoIndex()`. Adicionar `loadLocationIndex()` que faz `SELECT DISTINCT neighborhood, city FROM properties WHERE status='ativo'` e devolve dois sets normalizados (sem acento, lowercase). Cachear por ~5 min (mesmo padrão do condo index).

Passar essas listas para o system prompt do LLM (`condoSample` + `neighborhoodSample` + `citySample`) para ele saber quais bairros/cidades **existem de verdade** e nunca mais responder "só atendemos Alphaville/Tamboré".

### 2. Parser determinístico de bairro/cidade

Antes do LLM, tentar match exato de bairro/cidade na mensagem normalizada (usando `normalize_search_text` equivalente em JS). Exemplos:
- "granja viana" → `neighborhood: "Granja Viana"`.
- "em cotia" → `city: "Cotia"`.
- "alphaville" (sozinho, sem número) → **ambíguo**: pode ser bairro OU grupo de condomínios. Não decidir; gerar chips:
  - "Bairro Alphaville (todos)" → seta `neighborhood: "Alphaville"`.
  - "Alphaville 1" / "Alphaville 2" / … → seta `condominium`.
- "tamboré" (sozinho) → mesma lógica: chips "Bairro Tamboré" + condomínios Tamboré N.
- "alphaville 1", "tamboré 2" → mantém comportamento atual (condomínio).

### 3. System prompt v3 ajustado

No prompt do `extractSearchIntentV3`:
- Remover a frase implícita de escopo. Trocar "especialista em Alphaville/Tamboré" por "especialista em imóveis de alto padrão na região de Alphaville, Tamboré, Granja Viana e arredores (Cotia, Barueri, Santana de Parnaíba)".
- Adicionar regra explícita: **"Alphaville" e "Tamboré" são ambíguos** — podem ser bairro OU condomínio numerado. Quando o usuário citar sem número e sem outro contexto, devolver `needs_disambiguation: "alphaville" | "tambore"` ao invés de chutar.
- Adicionar campo `address_query` (string) para trechos de rua/endereço ("alameda araguaia", "rua x") → vira filtro `ilike` em `address`.
- Listar `neighborhoodSample` e `citySample` reais.

### 4. Tipos e filtros

`PropertySearchFilters` já tem `city` e `neighborhood` — só preciso adicionar `address?: string | null`. Estender:
- `loadActiveProperties()` e `countMatches()` para aplicar `ilike` em `address` quando presente (já fazem para city/neighborhood).
- `filtersToSearchParams()` em `src/components/search/ai-chat/types.ts` para incluir `address`.
- `AiChatFiltersSummary` para mostrar chip de bairro/cidade/endereço removível.
- `SearchResults.tsx` para ler `address` da URL (se ainda não lê).

### 5. Postura consultiva

Ajustar regras do prompt:
- Se só `neighborhood`/`city` foi setado e não há `transactionType`, NÃO marcar `show_results`; perguntar "compra ou aluguel?" e oferecer chips.
- Se `neighborhood: "Alphaville"` + nenhum condomínio, sugerir chip extra "Refinar por condomínio" que abre lista dos condomínios daquele bairro.
- Manter chip "Ver os N resultados" só quando houver pelo menos 2 filtros relevantes OU usuário pedir explicitamente.

### 6. Memória

Atualizar `.lovable/memory/features/search/ai-chat-modal.md` registrando: índice dinâmico de bairros/cidades, regra de desambiguação Alphaville/Tamboré bairro vs condomínio, filtro por `address`.

## Arquivos afetados

- `supabase/functions/ai-property-search/index.ts` (parser + prompt + índice de locais + filtro address)
- `src/components/search/ai-chat/types.ts` (campo `address`, params)
- `src/components/search/ai-chat/AiChatFiltersSummary.tsx` (chip de endereço/bairro/cidade)
- `src/pages/SearchResults.tsx` (ler `address` da URL — só se ainda não lê)
- `.lovable/memory/features/search/ai-chat-modal.md` (registro)

## Fora de escopo

- Não mexer no toggle Cognitivo/Tradicional, na busca tradicional, nem nos carrosséis da home.
- Não criar tabela nova de bairros/cidades — usar `DISTINCT` em `properties`.
- Não alterar `condominiums` nem aliases.
