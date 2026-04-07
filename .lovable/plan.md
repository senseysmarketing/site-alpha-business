

## Atualização da Página Principal — Conforme Layout de Referência

Comparando o print de referência com o site atual, identifiquei 4 mudanças principais:

---

### 1. Busca Tradicional com Filtros (SearchBarSection)

**Atual:** O toggle "Cognitivo / Busca tradicional" existe, mas ambos os modos mostram apenas o input de texto IA.

**Referência:** No modo "Busca tradicional", exibe uma linha de selects/filtros: Tipo, Preço mínimo, Até (preço máximo), Condomínio, Nº Quartos, e um botão "Buscar".

**Mudança:** Implementar o modo tradicional com uma row de filtros usando `<Select>`:
- Tipo (Casa, Apartamento, Terreno)
- Preço mínimo (faixas)
- Preço máximo (faixas)
- Condomínio (input ou select com opções de Alphaville)
- Nº Quartos (1, 2, 3, 4+)
- Botão "Buscar" que filtra por query na tabela `properties`

O modo "Cognitivo" continua como está (input IA + voz).

**Arquivo:** `src/components/SearchBarSection.tsx`

---

### 2. Lifestyle Section — Textos Atualizados

**Atual:** Título "Navegue pelo seu estilo de vida" com cards "Mansões Modernas", "Vida em Família", "Refúgios Sustentáveis".

**Referência:** Título "Encontre propriedades que representam seu estilo de vida" com cards "Imóveis para relaxar", "Imóveis Assinados", "Mais espaço para a família".

**Mudança:** Atualizar título e textos dos cards default para coincidir com o layout de referência.

**Arquivo:** `src/components/LifestyleSection.tsx`

---

### 3. AlphavilleMapSection — Grid de Condomínios

**Atual:** Mapa interativo com pins SVG e popups.

**Referência:** Título "Conheça o seu futuro imóvel em Alphaville" com grid simples de nomes de condomínios (Tamboré 1, Tamboré 2, Alphaville 1, etc.) cada um com links "Comprar | Alugar".

**Mudança:** Substituir o mapa interativo por um grid de texto com ~20 condomínios organizados em colunas, cada item mostrando nome + "Comprar | Alugar" como links.

**Arquivo:** `src/components/AlphavilleMapSection.tsx`

---

### 4. Seção de Contato — "Seu imóvel ainda não está na Alpha Business?"

**Atual:** Seção "Fale conosco" com fundo bordeaux escuro, imagem lateral, e campos Nome/WhatsApp/E-mail/Assunto/Mensagem.

**Referência:** Seção com fundo claro (cinza/branco), centrada, título "Seu imóvel ainda não está na Alpha Business?" com campos: Nome completo, E-mail, Telefone, Endereço completo do imóvel (textarea), e botão "Enviar".

**Mudança:** Redesenhar a ContactSection para fundo claro, layout centralizado, novos campos conforme referência. A submissão continua inserindo na tabela `leads` com `origin: 'anuncio_proprio'`.

**Arquivo:** `src/components/ContactSection.tsx`

---

### Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `src/components/SearchBarSection.tsx` | Adicionar modo tradicional com filtros |
| `src/components/LifestyleSection.tsx` | Atualizar textos |
| `src/components/AlphavilleMapSection.tsx` | Substituir mapa por grid de condomínios |
| `src/components/ContactSection.tsx` | Redesenhar com fundo claro e novos campos |

Nenhuma migração de banco necessária — todos os campos já existem na tabela `leads`.

