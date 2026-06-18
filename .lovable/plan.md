## Problema

No microfone do Rafa IA (modal de busca), ao iniciar uma nova gravação o texto da transcrição anterior é preservado e o novo áudio é **anexado** ao texto existente (em `AiSearchChatModal.tsx`, `toggleMic` faz `baseRef.current = input ? input.trim() + " " : ""`).

## Mudança

Arquivo: `src/components/search/ai-chat/AiSearchChatModal.tsx` (função `toggleMic`)

Ao **iniciar** uma nova gravação:
- Zerar `baseRef.current = ""`
- Zerar `setInput("")`
- Então chamar `startMic()`

Comportamento ao **parar**: permanece igual (apenas `stopMic()`), preservando o texto recém-transcrito para o usuário enviar ou editar.

Resultado: cada nova gravação começa do zero, descartando a transcrição anterior. O usuário ainda pode digitar manualmente entre gravações (esse texto será descartado se ele clicar no microfone novamente — comportamento aceitável e esperado, já que o botão de mic indica "regravar").

## Fora de escopo

- Nenhuma mudança no `useSpeechRecognition.ts`.
- Nenhuma mudança em outros campos com microfone (ex.: `BlogFilters`).