

## Diagnostico e Correcao — Busca AI sem Resultados + Chips + VoiceWaves

### Problema Raiz

A tabela `properties` no Supabase esta **vazia** (0 registros). A edge function `ai-property-search` busca apenas imoveis com `status = 'ativo'`, encontra zero, e retorna `{ results: [], parsed_filters: null }`. Por isso:

1. **Chips nao aparecem** — `parsed_filters` volta `null` porque a IA nao e chamada quando nao ha imoveis
2. **Resultados vazios** — O fallback para mock data no `SearchHero.tsx` funciona, mas no `HeroSection.tsx` nao ha fallback (mostra "Nenhum imovel encontrado")
3. **VoiceWaves** — O componente existe e funciona, mas so aparece quando `listening = true` (durante captura de voz). Visualmente esta correto.

### Plano de Correcao (3 mudancas)

**1. Inserir os 5 imoveis mock na tabela `properties` do Supabase**

Criar migration que insere os 5 imoveis do `mockProperties.ts` com `status = 'ativo'` para que a edge function tenha dados reais para buscar. Usar os mesmos IDs do mock data para manter consistencia.

**2. `HeroSection.tsx` — Adicionar fallback para mock data**

Atualmente, se a edge function falha ou retorna vazio, o HeroSection mostra "Nenhum imovel encontrado". Adicionar o mesmo fallback que ja existe no `SearchHero.tsx`: se a busca retorna vazio, filtrar `mockProperties` pelo texto e exibir resultados locais.

Isso tambem garante que `parsed_filters` seja gerado mesmo offline — criando um parser local simples que extrai filtros basicos do texto (preco, quartos, condominio) para exibir chips mesmo sem IA.

**3. Edge function — Garantir que `parsed_filters` e retornado mesmo com poucos resultados**

Atualmente, se `properties` esta vazio, a funcao retorna antes de chamar a IA. Ajustar para que, mesmo sem imoveis, a IA ainda seja chamada para extrair os filtros da query (parsed_filters), permitindo que os chips aparecam.

### Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar — INSERT dos 5 imoveis mock na tabela `properties` |
| `src/components/HeroSection.tsx` | Editar — Adicionar fallback mock + parser local de filtros |
| `supabase/functions/ai-property-search/index.ts` | Editar — Chamar IA mesmo com lista vazia para extrair parsed_filters |

### Resultado Esperado

- Buscar "casa ate 15 milhoes" → IA retorna imoveis + chips `💰 Ate R$ 15M` aparecem
- Busca sem conexao → fallback local com mock data + chips basicos
- VoiceWaves ja funciona (so visivel durante captura de voz)

