---
name: AI Search Chat (Rafa IA)
description: Modal de chat conversacional que substitui o modo Cognitivo na home e em /busca; LLM Gemini + validação Supabase
type: feature
---
**Gatilho**: Toggle Cognitivo/Tradicional permanece. O lado **Cognitivo** mostra um `AiSearchChatButton` (avatar Rafael + CTA) que abre o `AiSearchChatModal`. Aplica-se a `SearchBarSection.tsx` (home) e `search/SearchHero.tsx` (/busca). A busca tradicional fica idêntica.

**Componentes**: `src/components/search/ai-chat/` — `AiSearchChatModal`, `AiSearchChatButton`, `AiChatMessage`, `AiChatOptionChips`, `AiChatFiltersSummary`, `AiChatResultsPreview`, hook `useAiSearchChat`, `types.ts`. Estado da conversa é **efêmero** (useState, sem persistência). Avatar: `src/assets/rafa-avatar.png` (estático; troca futura por Lottie/Rive).

**Edge Function `ai-property-search`** (refatorada, mantém legacy):
- `action: "converse"` → pipeline: 1) regex de código `[A-Z]{2,3}\d{3,6}` em qualquer posição → retorno direto; 2) parse determinístico de preço (faixas, "até X mi", "X milhão e meio") e condomínio com número exato (`\bN\b` evita Tamboré 1 ≠ 10/11); 3) `parsePrice` detecta valor ambíguo (ex: "até 900") e pergunta unidade; 4) LLM **google/gemini-2.5-flash** via Lovable AI Gateway com `response_format: json_object` recebe lista real de condomínios; 5) resolução de grupo ambíguo (Tamboré sem número → chips com condomínios reais); 6) `countMatches` via `select count exact head` aplicando filtros duros; 7) decisão: matchCount=0 → ampliar, >60 → refinar, 1-60 + `nextAction=show` → `showResults` com top-4.
- `action: "search"` → busca final com `filters` + `limit`.
- Legacy `{ query }` → mantida para `?q=` na URL.

**Filtros duros vs score**: WHERE no Postgres = `code` (ilike), `transaction_type` (in), `condominium` (exato ilike), `property_type` (ilike), `min/max price` no campo certo (price vs rental_price), bedrooms/parking/area `gte`, `status=ativo`. Score in-memory = bônus por highlights + is_featured + recência.

**Navegação**: chip `kind: "navigate"` (value `show_all` ou `view`) ou botão "Ver resultados completos" do `AiChatResultsPreview` → `/busca?<URLSearchParams>` derivado de `PropertySearchFilters` via `filtersToSearchParams()`. `SearchResults.tsx` já lê esses params.

**Markdown**: mensagens do assistente renderizam Markdown via `react-markdown` (negrito em `**...**`).
