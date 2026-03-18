

## Busca Inteligente com IA + Transcrição de Voz em Tempo Real

### Visão Geral

Tornar a barra de busca do Hero funcional com:
1. **Busca por IA**: O usuário digita uma pergunta em linguagem natural → uma Edge Function busca todos os imóveis no Supabase, monta um contexto rico e usa Lovable AI (Gemini) para retornar os imóveis mais relevantes com explicação
2. **Transcrição por voz em tempo real**: Usar Web Speech API (`webkitSpeechRecognition`) com `interimResults` para mostrar a transcrição em tempo real no input enquanto o usuário fala
3. **Painel de resultados**: Exibir os resultados da busca IA em um dropdown/painel elegante abaixo da barra de busca

### Arquitetura

```text
┌──────────────────────┐
│  HeroSection (input) │
│  + voice (Speech API)│
└──────┬───────────────┘
       │ query text
       ▼
┌──────────────────────┐
│ Edge Function         │
│ "ai-property-search"  │
│  1. Busca TODOS os    │
│     imóveis no Supa   │
│  2. Monta contexto    │
│  3. Chama Lovable AI  │
│  4. Retorna matches   │
└──────────────────────┘
       │ JSON results
       ▼
┌──────────────────────┐
│ SearchResultsPanel    │
│ (dropdown com cards)  │
└──────────────────────┘
```

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/ai-property-search/index.ts` | **Criar** — Edge Function que busca imóveis e usa IA para ranquear/filtrar |
| `supabase/config.toml` | **Editar** — Registrar nova função |
| `src/components/HeroSection.tsx` | **Editar** — Adicionar lógica de busca, voice recognition com transcrição em tempo real, e painel de resultados |
| `src/components/SearchResultsPanel.tsx` | **Criar** — Componente de resultados da busca com cards de imóveis |

### Edge Function (`ai-property-search`)

1. Recebe `{ query: string }` do cliente
2. Busca todos os imóveis ativos do Supabase (título, código, descrição, condomínio, bairro, cidade, tipo, preço, quartos, área, destaques de engenharia, tipo de transação)
3. Monta um prompt de sistema explicando que é um assistente imobiliário de Alphaville
4. Envia a query do usuário + contexto dos imóveis para Lovable AI com tool calling
5. A tool `search_properties` retorna um array de `{ property_id, relevance_reason }` — os IDs dos imóveis que mais correspondem à busca
6. Retorna ao cliente os imóveis encontrados com a razão de relevância

### Voice Recognition (Web Speech API)

- Usar `webkitSpeechRecognition` com `interimResults = true` e `lang = "pt-BR"`
- Enquanto o usuário fala, atualizar o `query` state com o resultado parcial (interim) em tempo real
- Ao finalizar, usar o resultado final como query
- Indicação visual: botão Mic com animação pulsante durante gravação

### Painel de Resultados

- Aparece abaixo da barra de busca como um dropdown com `glass-panel`
- Mostra loading state com skeleton durante a busca
- Cada resultado mostra: foto (se houver), título, código, condomínio, preço, e a razão de relevância da IA
- Clicar em um resultado navega para `/imovel/:id`
- Fechar ao clicar fora ou pressionar Escape

### Fluxo do Usuário

1. Digita ou fala → texto aparece no input em tempo real
2. Clica "Buscar" ou pressiona Enter → chamada à Edge Function
3. Loading spinner no botão Buscar
4. Resultados aparecem em dropdown elegante
5. Clica em um resultado → navega para a página do imóvel

