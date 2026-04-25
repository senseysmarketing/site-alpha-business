## Corrigir modelo Gemini para chaves de API novas

O Google retornou erro 404 informando que `gemini-2.0-flash` não está disponível para novos usuários da API. Precisamos migrar para `gemini-1.5-flash` que é compatível com todas as chaves.

### Alterações

1. **blog-ai-assist/index.ts**
   - Linha 68: Alterar `model: "gemini-2.0-flash"` para `model: "gemini-1.5-flash"`

2. **parse-property/index.ts**
   - Linha 38: Alterar `model: "gemini-2.0-flash"` para `model: "gemini-1.5-flash"`

### Pós-alteração
- Deploy das duas edge functions (`blog-ai-assist` e `parse-property`)
- Teste rápido para confirmar funcionamento

Nenhuma outra mudança necessária - endpoint OpenAI-compatible, tratamento de erro 429 e estrutura de tools permanecem idênticos.