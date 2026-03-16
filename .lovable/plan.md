

## Plano: Filtros Separados + Input de IA no Cadastro de Imóvel

### 1. Separar filtros na listagem de imóveis (`src/pages/admin/Properties.tsx`)

**Problema**: Os dois grupos de filtro (Condomínio e Transação) ambos começam com "Todos", causando redundância visual e confusão.

**Solução**: Adicionar labels visuais antes de cada grupo de filtros para criar separação clara:
- Grupo 1: Label "Condomínio" + chips (Todos, Residencial 1, Residencial 2, Tamboré)
- Grupo 2: Label "Transação" + chips (Todos, Venda, Locação)
- Inserir um separador vertical (`|` ou `border-r`) entre os dois grupos
- Isso mantém os dois "Todos" mas cada um fica contextualizado ao seu grupo

### 2. Adicionar etapa de Input com IA no formulário (`src/pages/admin/PropertyForm.tsx`)

**Objetivo**: Antes das abas existentes, mostrar uma seção de "Preenchimento com IA" onde o usuário pode digitar uma descrição em texto livre ou usar o microfone para ditar, e a IA processará o texto para preencher os campos automaticamente.

**Implementação**:
- Adicionar nova aba "IA" como primeira aba no TabsList (antes de "Dados Básicos")
- Conteúdo da aba: Textarea grande com placeholder "Descreva o imóvel com suas palavras..." + botão de microfone ao lado
- Botão "Processar com IA" que envia o texto para uma edge function
- A edge function usa Lovable AI (Gemini) com tool calling para extrair campos estruturados (código, título, tipo, quartos, banheiros, área, preço, condomínio, descrição, etc.)
- Resposta da IA preenche automaticamente os states do formulário

**Edge function** (`supabase/functions/parse-property/index.ts`):
- Recebe `{ text: string }` 
- Usa Lovable AI Gateway com tool calling para extrair dados estruturados
- Retorna JSON com campos mapeados para o formulário

**Microfone**: Usar Web Speech API (`webkitSpeechRecognition`) do browser para transcrição em tempo real — sem necessidade de API externa. Fallback: toast informando que o navegador não suporta.

### 3. Config do Supabase (`supabase/config.toml`)
- Adicionar configuração da edge function `parse-property` com `verify_jwt = false`

### Arquivos modificados
1. `src/pages/admin/Properties.tsx` — Labels nos grupos de filtro + separador visual
2. `src/pages/admin/PropertyForm.tsx` — Nova aba "IA" com textarea + microfone + botão processar
3. `supabase/functions/parse-property/index.ts` — Edge function para processar texto com Lovable AI
4. `supabase/config.toml` — Registrar a edge function

