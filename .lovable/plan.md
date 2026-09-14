# Reajuste das URLs públicas dos imóveis

## Objetivo
Adotar como URL canônica o padrão:

`/imovel/[tipo-plural]-em-[regiao]/[condominio]/[titulo]-[codigo]`

Exemplo:

`/imovel/casas-em-alphaville/alphaville-2/casa-com-5-suites-a-venda-889-m-por-r-28-900-000-alphaville-2-barueri-sp-ca1020`

O UUID continuará sendo a identidade interna do imóvel. Nenhum vínculo de lead, agenda, CRM ou cadastro será alterado.

## Implementação

1. **Atualizar a regra oficial de URL no site**
   - Criar pluralização explícita para os tipos existentes: casas, apartamentos, terrenos e galpões, com fallback `imoveis`.
   - Criar uma função isolada de região SEO, usando `alphaville` como padrão comercial atual e deixando regras explícitas preparadas para regiões futuras, sem depender de dados incompletos de condomínio.
   - Manter o condomínio específico no segundo segmento.
   - Simplificar o último segmento para `title + code`, sem acrescentar novamente metragem, dormitórios, condomínio ou cidade.
   - Normalizar acentos, espaços e códigos; o código permanece obrigatoriamente no final.
   - Manter o fallback `/imovel/:uuid` quando não houver código válido.

2. **Preservar compatibilidade sem mudar as rotas internas**
   - Manter as duas rotas públicas já existentes: amigável e UUID.
   - Continuar resolvendo URLs amigáveis antigas pelo código final e URLs legacy pelo UUID.
   - Após localizar o registro, substituir diretamente qualquer formato antigo pela nova URL canônica, sem passar pelo formato intermediário.
   - Não alterar `/admin/imoveis/:id`, banco, RLS, leads, agenda ou RPCs.

3. **Eliminar links públicos ainda não canônicos**
   - Trocar os três compartilhamentos da ficha do imóvel, que hoje usam UUID, pela URL calculada do imóvel.
   - Fazer o autocomplete por código buscar os campos necessários e navegar diretamente pela nova URL.
   - Revisar home, carrosséis, busca, cards, similares, Rafa IA e CRM; manter UUID apenas onde ele é identidade interna ou rota administrativa.

4. **Sincronizar SEO, páginas estáticas e Rafa IA**
   - Aplicar a mesma taxonomia e simplificação no gerador de Open Graph/páginas estáticas.
   - Fazer canonical, `og:url`, JSON-LD, índice estático, links relacionados e sitemap apontarem somente para o novo formato.
   - Preservar a página estática legacy por UUID com canonical para a nova URL, sem incluí-la no sitemap.
   - Atualizar o gerador de links da Edge Function da Rafa IA para produzir exatamente o mesmo caminho.
   - Criar fixtures compartilhadas de paridade ou testes equivalentes para impedir divergência futura entre site, gerador SEO e Rafa IA.

5. **Cobertura de testes**
   - Ampliar os testes unitários para casa, apartamento, terreno, galpão/fallback, venda, locação, ambos, acentos, código normalizado, ausência de condomínio e fallback UUID.
   - Cobrir CA1020 e casos de Alphaville, Tamboré e Gênesis, comprovando que todos usam a região ampla `alphaville`.
   - Validar que título já completo não recebe dados duplicados.
   - Validar abertura e normalização direta de URL UUID e do formato amigável anterior.

6. **Validação integrada antes da publicação**
   - Executar testes unitários, testes da Edge Function e build completo com geração estática.
   - Inspecionar o sitemap e HTML produzido para canonical, Open Graph e JSON-LD.
   - Testar manualmente navegação pela home, busca, similares, autocomplete, compartilhamento e Rafa IA.
   - Confirmar que criação de lead e agendamento continuam gravando o UUID real do imóvel.
   - Fazer smoke test em imóveis de tipos e condomínios diferentes, incluindo CA1020.

## Detalhes técnicos confirmados
- A ficha já resolve imóvel por UUID ou pelo código ao final do slug e já normaliza o caminho com navegação de substituição.
- Existem hoje três implementações paralelas da regra: frontend, gerador estático e Edge Function da Rafa IA.
- O sitemap, canonical, Open Graph, JSON-LD e índice estático derivam da regra do gerador de build.
- Ainda há três compartilhamentos na ficha e o autocomplete por código usando `/imovel/${id}` diretamente.
- Os tipos ativos atuais são casa, apartamento, terreno e galpão.
- O campo de região dos condomínios não está uniforme; por isso ele não será adotado como única fonte nesta etapa.

## Fora do escopo
- Migração ou alteração de dados no Supabase.
- Mudanças em RLS, CRM, pipeline, leads ou agendamentos.
- Mudança do UUID interno dos imóveis.
- Alteração visual das páginas.
- Publicação automática: será feita somente após validação e solicitação/etapa de publicação.
