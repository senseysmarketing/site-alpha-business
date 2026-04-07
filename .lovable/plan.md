

## Modal "Anuncie seu Imóvel" — Plano Atualizado

Mesmo plano aprovado anteriormente, com uma única alteração:

### Mudança no Bloco B — Localização

**Antes:** Select com opções pré-definidas de condomínios de Alphaville.

**Agora:** Input de texto livre (`<input type="text">`) com placeholder "Ex: Alphaville Residencial 2, Tamboré..." para que o usuário digite a localização desejada.

### Arquivos

#### 1. Criar `src/components/AdvertisePropertyModal.tsx`
- Bloco A (Seus Dados): Nome, E-mail, WhatsApp (máscara BR)
- Bloco B (Sobre o Imóvel): Tipo (Select), **Localização (input texto livre)**, Valor (máscara R$), Destaques (textarea)
- Submit → insert na tabela `leads` com `origin: 'anuncio_proprio'`, `pipeline_stage: 'novos'`
- Tela de sucesso com check icon e mensagem de agradecimento

#### 2. Editar `src/components/Header.tsx`
- Trocar "Acessar meu imóvel" por "Anuncie seu imóvel" abrindo o modal

Tudo mais permanece idêntico ao plano anterior.

