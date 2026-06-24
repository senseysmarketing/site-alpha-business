## Diagnóstico

Conferi no banco quantos imóveis ATIVOS existem com `condominium = "Alphaville 1"` e `property_type = casa`:

```
venda   3 dorms →  1
venda   4 dorms → 24
venda   5 dorms →  9
locação 3 dorms →  1
locação 4 dorms →  2
locação 5 dorms →  2
TOTAL          → 39
```

Ou seja, **o número correto para "casa no Alphaville 1" é 39**, não 1 e nem 10. Os dois retornos da conversa estão errados.

### Por que aconteceu

1. **Numeralização** (`numeralizePtBr`) já existe e converte `"alphaville um" → "alphaville 1"` antes de mandar pro LLM. Isso está OK isoladamente.
2. **O caminho V3 (`handleConverseV3`) não usa o parser determinístico `findCondoNumber`.** A resolução do condomínio depende 100% do Gemini decidir devolver `condominium: "Alphaville 1"` no patch. Quando o Gemini erra, a fuzzy `resolveCondominium` pode resolver para outro Alphaville (ex: "Alphaville Residencial 1" tem 1 casa → bate com os "1 imóvel encontrado") ou cair em `did_you_mean`.
3. **O LLM está inventando/herdando filtros que o usuário não pediu** (ex: `minBedrooms`, `transactionType`), reduzindo 39 → 10. O prompt já diz "NUNCA invente filtros" mas o Gemini diverge mesmo assim, principalmente quando há histórico de conversa anterior.
4. **Não há logs ativos** da edge function pra confirmar qual patch o Gemini está devolvendo — precisamos instrumentar.

## Plano de correção

### 1. Resolver condomínio + número de forma determinística (pré-LLM)

No início de `handleConverseV3`, depois do `numeralizePtBr` e antes de chamar o LLM:

- Rodar `findCondoNumber(message)` (já existente). Se casar `(tambore|alphaville|residencial) <N>`, montar localmente um `forcedCondo = "{Grupo} {N}"` e aplicar direto em `state.condominium` (resolvendo pelo `entries` com `resolveCondominium` para pegar a grafia canônica). Isso garante que "Alphaville 1", "alphaville um", "tambore 2", "tamboré dois" sempre fixem o condomínio certo, sem depender do Gemini.
- Se `forcedCondo` foi aplicado, marcar uma flag pra que o `applyPatchV3` posterior **não sobrescreva** `condominium` com algo que o LLM devolva diferente.

### 2. Impedir o LLM de inventar filtros adicionais

No prompt de `extractSearchIntentV3`:

- Listar explicitamente os filtros do `state` atual e instruir: "**NUNCA repita filtros já presentes no estado, NUNCA adicione `minBedrooms`, `transactionType`, `minPrice`, `maxPrice` se o usuário não citou número/valor/'compra'/'aluguel' nesta mensagem.**"
- Adicionar exemplos negativos curtos ("Mensagem: 'casa no alphaville 1' → filters_patch: { propertyType: 'casa', condominium: 'Alphaville 1' }. NÃO devolver minBedrooms nem transactionType.").

Adicionalmente, no `applyPatchV3`, ignorar campos do `filters_patch` que não foram mencionados na mensagem atual quando `state` já estava vazio nesses campos (sanity check): só aceitar `minBedrooms`/`minPrice`/`maxPrice`/`transactionType` vindos do LLM se houver evidência textual (`/\d/`, `/venda|comprar|alugar|locac/`, etc.) na mensagem original.

### 3. Instrumentação para diagnóstico

Adicionar logs específicos no V3 (já tem `console.log` esparsos):

- Log do `message` numeralizado, do `forcedCondo` deterministico, do `patch` retornado pelo LLM, do `state` final e do `matchCount`.
- Esses logs já caem em `supabase functions logs ai-property-search` e nos permitem confirmar a regressão se o usuário reportar de novo.

### 4. Validação

- Rodar manualmente (Playwright/preview):
  1. Modal limpo → "quero uma casa no alphaville um" → deve retornar **39** com filtros `{ propertyType: casa, condominium: "Alphaville 1" }`.
  2. Modal limpo → "Alphaville 1" + casa via chips → deve retornar **39**.
  3. "tambore dois" → deve fixar condomínio "Tamboré 2".
- Conferir count contra `SELECT count(*) FROM properties WHERE status='ativo' AND condominium_normalized='alphaville 1' AND property_type ILIKE '%casa%'` (39).

## Arquivos afetados

- `supabase/functions/ai-property-search/index.ts` — `handleConverseV3` (pre-resolve determinístico), `extractSearchIntentV3` (prompt mais restritivo), `applyPatchV3` (guard contra filtros inventados), logs adicionais.

Sem alterações de schema, RLS, ou frontend.
