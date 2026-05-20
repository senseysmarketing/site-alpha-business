# Mega menu de condomínios — automação e scroll

## Objetivo
Manter a altura/largura atuais do mega menu e tornar as duas primeiras colunas roláveis. Destaques continua manual (com scroll), e a coluna de Regiões passa a ser gerada automaticamente a partir dos condomínios cadastrados, agrupando nomes iguais com sufixo numérico.

## Mudanças

### 1. Coluna "Destaques" (Header.tsx — desktop e mobile)
- Mantém cadastro manual via admin (sem mudança de schema).
- Altura visível travada para mostrar ~3 cards; itens excedentes ficam acessíveis via **scroll vertical interno da coluna** (`max-h-[...] overflow-y-auto`), com scrollbar discreta.
- O container do mega menu mantém sua altura atual; apenas a coluna Destaques scrolla.

### 2. Coluna "Por Região" — automática a partir do banco
- Remover totalmente a leitura de `condo_menu.regions` no Header.
- Buscar em `properties` (status `ativo`, `condominium not null`) a lista distinta de condomínios e construir os grupos no client com a seguinte regra:
  - **Normalização**: trim, colapso de espaços, remoção de acentos e case-insensitive apenas para *agrupar* (o rótulo exibido usa a versão canônica mais frequente do banco).
  - **Detecção de sufixo numérico**: se o nome termina em ` <número>` (regex `^(.*?)\s+(\d+)$`), separa em `base` + `num`.
  - **Agrupamento**:
    - Se a `base` (normalizada) aparece em 2+ registros com sufixo numérico → cria um grupo com título = `base` canônica e filhos = apenas os números (`1`, `2`, …, `12`), ordenados numericamente.
    - Se aparece só uma vez (ou sem sufixo) → entra como item solo, exibindo o nome completo.
  - Cada link aponta para `/busca?condo=<nome completo do condomínio>` (mesmo padrão já usado em `AlphavilleMapSection`).
- Layout: título do grupo em destaque + linha horizontal compacta de números clicáveis (chips minimalistas) para grupos numerados; itens solo seguem o estilo atual de link de texto.
- Coluna também ganha **scroll vertical interno** com a mesma altura travada de Destaques, para acomodar a lista completa sem expandir o mega menu.
- Ordenação alfabética dos grupos/itens.

### 3. Admin `/admin/configuracoes` (SiteSettings.tsx)
- **Remover** o bloco de edição "Regiões e Links" do bloco do menu de condomínios.
- Manter apenas o editor de "Destaques" (sem limite de quantidade, já que agora há scroll).
- A chave `condo_menu` permanece no `site_settings`, mas o campo `regions` deixa de ser lido/escrito pela UI (mantido no payload para compatibilidade, ignorado).

### 4. Mobile
- Mesma lógica aplicada ao accordion "Condomínios" do menu mobile: Destaques com scroll, Regiões geradas automaticamente com scroll interno e chips numerados.

## Detalhes técnicos
- Nova query no `Header.tsx`: `supabase.from('properties').select('condominium').eq('status','ativo').not('condominium','is',null)` + `useQuery` (TanStack) com cache de 5 min.
- Função utilitária `buildCondoRegions(rows)` em `src/lib/condoGrouping.ts` (testável) que retorna `{ groups: Array<{ base: string; canonical: string; items: Array<{ label: string; full: string }> }>, singles: Array<{ label: string; full: string }> }`.
- Sem migração de banco. Sem alteração em rotas.
- Memórias a atualizar após implementação: `features/header/navigation` (nova fonte automática + scroll) e `features/admin/identity-control` (remoção do editor de regiões).

## Fora de escopo
- Não vamos consolidar/normalizar duplicatas com acento no banco (ex.: `Tamboré 1` vs `Tambore 1`) — o agrupamento no menu já os trata como mesmo grupo via normalização. Limpeza dos dados pode ser feita em tarefa separada se desejar.