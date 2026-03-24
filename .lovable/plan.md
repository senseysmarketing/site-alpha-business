

## AI Concierge de Luxo — Refinamento do Motor de Busca

### Escopo

Transformar a busca atual em um concierge inteligente que extrai filtros estruturados da linguagem natural, exibe chips de confirmacao em tempo real, e melhora o feedback visual de voz.

### Arquitetura

A IA ja recebe todos os imoveis e faz matching via tool calling. O refinamento principal e no **prompt do sistema** (edge function) e na **interface do frontend** (chips + feedback de voz).

**Nao sera implementado pgvector/semantic search** neste momento — o sistema ja envia toda a base para a IA, que faz busca semantica "in-context". pgvector seria prematura otimizacao com poucos imoveis.

---

### Passo 1 — Edge Function: Prompt Refinado + Filtros Estruturados

**`supabase/functions/ai-property-search/index.ts`** — Editar

Atualizar o system prompt para instruir a IA a:
- Interpretar ranges de preco ("ate 12M", "entre 8 e 10 milhoes", "minimo 5M")
- Extrair atributos fisicos (quartos, suites, vagas, metragem)
- Reconhecer condominios por variantes ("Res. 1", "Residencial Um", "Tambore")
- Buscar qualitativos na descricao ("moderna", "face norte", "piso aquecido")

Adicionar novo campo `parsed_filters` no tool schema para retornar os filtros extraidos:

```
parsed_filters: {
  price_min, price_max, bedrooms_min, bathrooms_min, parking_min,
  area_min, condominium, qualitative_terms[], transaction_type
}
```

A resposta da edge function passa a retornar `{ results, parsed_filters }`.

### Passo 2 — Chips de Filtro Dinamicos (Frontend)

**`src/components/HeroSection.tsx`** e **`src/components/search/SearchHero.tsx`** — Editar

Apos receber a resposta da busca com `parsed_filters`:
- Renderizar chips abaixo da barra de busca mostrando o que a IA entendeu
- Chips com icones: `💰 Max R$ 15M`, `📍 Residencial 1`, `🛏 4+ quartos`, `📐 400m²+`
- Estilo: bg translucido, borda 1px, font-mono para valores numericos
- Animacao de entrada com `framer-motion` stagger
- Chip removivel (X) que re-executa busca sem aquele filtro

### Passo 3 — Feedback Visual de Voz Aprimorado

**`src/components/HeroSection.tsx`** e **`src/components/search/SearchHero.tsx`** — Editar

Melhorar o indicador de escuta:
- Substituir a animacao de borda pulsante por barras de onda sonora minimalistas (3 barras animadas com alturas alternadas via framer-motion)
- Texto "Ouvindo..." em `text-body text-xs` abaixo do input enquanto escuta
- Transicao suave ao finalizar voz: chips aparecem progressivamente

### Passo 4 — SearchResultsPanel com Chips

**`src/components/SearchResultsPanel.tsx`** — Editar

Adicionar prop `parsedFilters` e renderizar os chips no topo do painel de resultados, antes da contagem.

### Passo 5 — Pagina de Busca (/busca) com Chips

**`src/pages/SearchResults.tsx`** — Editar

- Armazenar `parsedFilters` no estado
- Exibir chips no toolbar acima dos resultados
- `SearchHero` passa `parsedFilters` via callback

---

### Estetica

- Chips: `bg-background/80 border border-border/50 rounded-full px-3 py-1`
- Valores em `font-mono` para precisao
- Icones emoji inline (💰 📍 🛏 📐 🏷)
- Transicoes suaves 300ms
- Barras de voz: 3 divs de 2px width, alturas [12px, 20px, 16px] animadas

### Arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/ai-property-search/index.ts` | Editar prompt + schema |
| `src/components/HeroSection.tsx` | Editar — chips + voz |
| `src/components/search/SearchHero.tsx` | Editar — chips + voz |
| `src/components/SearchResultsPanel.tsx` | Editar — prop parsedFilters |
| `src/pages/SearchResults.tsx` | Editar — estado parsedFilters |

