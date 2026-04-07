

## Ajustes: Largura do Painel de Resultados + Refinamento da Busca IA

### Problemas identificados

1. **Layout**: O `SearchResultsPanel` usa `absolute left-0 right-0` — ele se posiciona relativo ao container pai (`max-w-4xl`), que já é limitado. Porém o `position: absolute` com `left-0 right-0` faz o painel preencher toda a largura do container pai de forma correta, mas visualmente ele aparece fora do card branco. Precisa ficar **dentro** do card e respeitar o padding dele.

2. **Busca "puxando coisas nada com nada"**: O fallback local no `SearchBarSection` (linhas 89, 100) retorna **todos os mockProperties** quando não encontra nada — ou seja, qualquer busca sem resultado mostra tudo. Além disso, o prompt da IA não instrui explicitamente para **não retornar imóveis irrelevantes**.

---

### 1. Ajustar layout do painel de resultados
**Arquivo:** `src/components/SearchResultsPanel.tsx`
- Trocar de `absolute left-0 right-0 top-full mt-3` para layout **inline/relative** dentro do card
- Usar `relative` com `mt-4` e `border-t` para separar visualmente
- Remover `max-h-[60vh]` e usar `max-h-[50vh]` com scroll interno
- Manter dentro do card branco da SearchBarSection, respeitando o padding

**Arquivo:** `src/components/SearchBarSection.tsx`
- Mover o `SearchResultsPanel` para ficar **dentro** do `motion.div` do card branco (já está, mas ajustar o posicionamento relativo do container)
- Garantir que o container pai tenha `position: relative` e `overflow: visible`

### 2. Refinar a busca IA
**Arquivo:** `supabase/functions/ai-property-search/index.ts`
- Adicionar ao prompt: "Se nenhum imóvel corresponder à busca, retorne matches vazio. NÃO force resultados irrelevantes."
- Adicionar: "Só retorne imóveis que realmente atendam pelo menos um critério explícito da busca do usuário."
- Adicionar: "Se a busca for vaga ou genérica (ex: 'casa'), priorize imóveis em destaque (is_featured)."

**Arquivo:** `src/components/SearchBarSection.tsx`
- Remover o fallback que retorna **todos** os mockProperties quando não há match (linha 89 e 100: `mockProperties.map(toSearchResult)`)
- Em vez disso, retornar array vazio e exibir mensagem "Nenhum imóvel encontrado"
- Manter fallback de texto local apenas para os que realmente fazem match textual

### Arquivos a editar
- `src/components/SearchResultsPanel.tsx` — layout inline dentro do card
- `src/components/SearchBarSection.tsx` — remover fallback genérico
- `supabase/functions/ai-property-search/index.ts` — refinar prompt

