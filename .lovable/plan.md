## Objetivo
Tornar 100% funcionais os links do Header e do Footer, removendo itens sem destino e corrigindo âncoras quebradas.

## Menu final

**Header** (desktop e mobile):
- Venda → `/busca?modalidade=venda`
- Locação → `/busca?modalidade=locacao`
- Notícias → `/blog`
- Fale Conosco → `#contato` (com fallback inteligente: se não estiver na home, navega para `/#contato`)
- (Removidos: Buscar, Serviços)

**Footer**:
- Venda → `/busca?modalidade=venda`
- Locação → `/busca?modalidade=locacao`
- Fale Conosco → `/#contato`
- (Removidos: Sobre, Serviços)

## Mudanças técnicas

1. **`src/components/Header.tsx`**
   - Atualizar `navItems` removendo Buscar e Serviços.
   - Trocar destinos de Venda/Locação para rotas reais (`/busca?modalidade=...`) usando `Link` do React Router.
   - Corrigir o link Fale Conosco: hoje aponta `#contact`, mas a seção tem `id="contato"`. Mudar para `#contato` e usar um handler que, quando o usuário não está em `/`, faça `navigate("/#contato")` e role até a seção após a navegação.

2. **`src/components/Footer.tsx`**
   - Atualizar `navItems` removendo Sobre e Serviços.
   - Trocar `href="#"` por destinos reais (`Link` para `/busca?modalidade=...` e `/#contato`).
   - Aplicar o mesmo handler de rolagem para Fale Conosco.

3. **`src/pages/SearchResults.tsx`** (verificação rápida)
   - Confirmar que o parâmetro `modalidade` (venda/locacao) já é lido pelos filtros tradicionais. Caso ainda não exista esse mapeamento, adicionar leitura de `searchParams.get("modalidade")` no estado inicial dos filtros para que o link já chegue filtrado. Se o filtro existente usa outra chave (ex.: `tipo` ou `transacao`), alinhar o nome do parâmetro entre o link e o leitor.

4. **Comportamento de âncora cross-page**
   - Pequeno utilitário (inline nos componentes) que, ao clicar em "Fale Conosco":
     - se `location.pathname === "/"` → `scrollIntoView` suave em `#contato`.
     - caso contrário → `navigate("/#contato")` e, no `Index.tsx`, um `useEffect` que detecta `location.hash` no mount e rola até o elemento.

5. **Memória do projeto**
   - Atualizar `mem://features/header/navigation` e `mem://features/footer/footer-standard` refletindo o novo conjunto de itens e destinos.

## Resultado esperado
Nenhum link com `href="#"`. Todos navegam para uma rota válida ou rolam até uma seção existente, inclusive a partir de páginas internas (blog, busca, imóvel).