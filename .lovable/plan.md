## Objetivo

Tornar a lista de condomínios do mega menu (coluna "Por Condomínio") e a seção da home (`AlphavilleMapSection`) automaticamente alimentadas pela tabela `condominiums` do admin, em vez de derivar de `properties.condominium`. Sempre que um condomínio novo for cadastrado em `/admin/condominios` (e estiver `is_active = true`), ele aparece automaticamente nos dois lugares, e os links levam para `/busca?condominium=<nome>` com o filtro já ativado.

## Mudanças

### 1. `src/components/Header.tsx` — coluna "Por Condomínio"
- Trocar a `useQuery` `header-condos` para buscar de `condominiums` em vez de `properties`:
  - `select("name").eq("is_active", true)`.
- Passar `data.map(r => r.name)` para `buildCondoMenuData` — mantém o mesmo formato visual (agrupamento por nome base + chips numerados, ex.: "Alphaville 1..12").
- Trocar o param do link de `?condo=` para `?condominium=` para alinhar com o filtro real da busca (mesmo usado em `AlphavilleMapSection`). Aplicar em desktop e mobile.

### 2. `src/components/AlphavilleMapSection.tsx` — grid da home
- Trocar a query `condo-availability` para buscar de `condominiums` (`name`, `is_active = true`), ordenado por `name`.
- Manter os dois botões "Comprar / Alugar" por condomínio, mas como não temos mais a info de disponibilidade vinda dos imóveis, fazer um segundo `select` em `properties` (status ativo, condominium not null) somente para montar o mapa de disponibilidade `{ hasVenda, hasAluguel }` por nome. Condomínios cadastrados sem imóveis ainda aparecem (com ambos os botões habilitados como fallback, ou só "Ver imóveis" sem filtro de tipo — confirmar abaixo).
- Mantém grid, expand/collapse e navegação para `/busca?condominium=<nome>&transactionType=<tipo>`.

### 3. Nada muda em:
- `/admin/condominios` (já é a fonte da verdade).
- `condoGrouping.ts` (continua agrupando "Alphaville 1..12").
- Filtro da `/busca` (já lê `condominium` da URL).
- Coluna "Destaques" do mega menu (continua manual via `site_settings.condo_menu.featured`).

## Ponto a confirmar

Para condomínios cadastrados em `condominiums` **sem imóveis ativos** correspondentes (match por nome), o que mostrar na home?
- (a) Esconder esses condomínios (só mostrar os que têm pelo menos 1 imóvel).
- (b) Mostrar com ambos os botões "Comprar/Alugar" habilitados, levando para a busca (que pode vir vazia).
- (c) Mostrar com um único link "Ver imóveis" sem filtro de transação.

Vou assumir **(a)** se nada for dito — é o comportamento atual e evita levar o usuário a buscas vazias. O mega menu pode seguir lógica diferente: mostra **todos** os condomínios ativos (catálogo), enquanto a home foca em quem tem oferta. Confirmar.
