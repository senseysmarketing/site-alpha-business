# Ajustes no Rafa IA

## 1) Reconhecer números por extenso (ex.: "Tamboré dois" → "Tamboré 2")

Hoje, o parsing no backend (`supabase/functions/ai-property-search/index.ts`) usa regex com `\d+` para identificar número do condomínio, quartos, área e preço. Se o usuário escreve/dita "dois", "três", "quinhentos mil", etc., nada é reconhecido.

**Solução:** adicionar um normalizador de numerais por extenso (pt-BR) e aplicá-lo logo no início de cada parser que depende de números.

- Adicionar utilitário `numeralizePtBr(text)` em `supabase/functions/ai-property-search/index.ts`, logo após `norm()`. Ele substitui palavras por dígitos:
  - Unidades: um/uma→1, dois/duas→2, três→3, ... nove→9
  - 10 a 19: dez, onze, doze, treze, quatorze/catorze, quinze, dezesseis, dezessete, dezoito, dezenove
  - Dezenas: vinte..noventa (com suporte a "vinte e cinco" → 25)
  - Centenas: cem/cento, duzentos, trezentos, ... novecentos (com "e" opcional)
  - Multiplicadores: "mil", "milhão/milhões" — aplicados ao número anterior (ex.: "quinhentos mil" → 500000; "um milhão e duzentos mil" → 1200000)
  - Casos isolados típicos do uso ("meio milhão" → 500000)
- Aplicar `numeralizePtBr` dentro de:
  - `findCondoNumber` (para pegar "tambore dois" → "tambore 2")
  - `parseBedrooms` (ex.: "três quartos")
  - `parseArea` (ex.: "duzentos metros")
  - `parsePrice` (ex.: "quinhentos mil", "um milhão e duzentos")
- Não alterar `norm()` original (mantém compatibilidade com outros usos textuais como termos de handoff).

## 2) Parar o microfone automaticamente ao enviar mensagem

Em `src/components/search/ai-chat/AiSearchChatModal.tsx`, `handleSubmit` envia o texto mas não chama `stopMic()`. Se o usuário usou voz e clica em enviar (ou pressiona Enter), o mic continua gravando.

**Solução:** em `handleSubmit`, se `isRecording` for `true`, chamar `stopMic()` antes de limpar o input e disparar `send`. Próximo uso só reinicia quando o usuário clicar no botão do mic novamente (comportamento atual já preservado por `toggleMic`).

## Arquivos alterados

- `supabase/functions/ai-property-search/index.ts` — novo helper `numeralizePtBr` + uso nos 4 parsers
- `src/components/search/ai-chat/AiSearchChatModal.tsx` — `stopMic()` no `handleSubmit` quando estiver gravando
