Plano de implementação para corrigir e fortalecer a busca de imóveis

1. Corrigir o erro atual de busca IA
- O erro visto no preview vem da Edge Function `ai-property-search` retornando 402 por créditos insuficientes no Lovable AI.
- Vou ajustar o fluxo para que falta de créditos não quebre a experiência do usuário.
- Quando a IA estiver indisponível por 402/429/erro temporário, a busca continuará funcionando com um motor determinístico no próprio backend, usando os imóveis cadastrados no Supabase.
- O frontend deixará de cair para dados de demonstração (`mockProperties`) nesses casos.

2. Criar busca determinística completa nos imóveis cadastrados
- Dentro da Edge Function `ai-property-search`, vou implementar um fallback forte que consulta todos os imóveis ativos e pontua cada imóvel conforme a busca do usuário.
- A busca vai considerar todos os campos relevantes do imóvel:
  - código
  - título
  - descrição
  - tipo do imóvel
  - tipo de transação
  - condomínio
  - bairro
  - cidade
  - endereço
  - preço de venda
  - preço de locação
  - dormitórios/suítes/banheiros/vagas
  - área total/construída
  - destaques de engenharia
- A comparação será normalizada para ignorar maiúsculas/minúsculas e acentos.

3. Melhorar interpretação de intenção
- Padronizar o entendimento de transação:
  - “comprar”, “venda”, “à venda” -> `venda`
  - “alugar”, “aluguel”, “locação”, “locacao” -> `locacao`
- Importante: o banco usa `locacao`, não `aluguel`. Hoje há partes do site esperando `aluguel`, o que afeta filtros e botões.
- Corrigir esse desalinhamento nas telas de busca e na seção de condomínios.
- Interpretar números comuns da busca:
  - valores como “até 5 milhões”, “5M”, “R$ 4.700.000”
  - dormitórios/suítes/quartos
  - banheiros
  - vagas
  - metragem
- Gerar `parsed_filters` mesmo no fallback, para manter os chips visuais da busca.

4. Tornar os resultados mais assertivos
- Ordenar os resultados por pontuação de relevância, não por ordem aleatória.
- Dar prioridade para:
  - código exato do imóvel
  - condomínio exato ou muito próximo
  - transação correta
  - termos encontrados no título/descrição/destaques
  - faixa de preço e características físicas compatíveis
- Retornar uma justificativa curta por imóvel, por exemplo:
  - “Condomínio Alphaville 1, venda, 4 suítes e piscina encontrados na descrição.”
- Se a busca for muito genérica, ainda retornar imóveis relevantes, priorizando destaque e cadastros mais recentes.
- Se não houver correspondência real, retornar lista vazia em vez de forçar imóveis irrelevantes.

5. Ajustar o frontend para usar dados reais
- Em `src/components/search/SearchHero.tsx`:
  - Remover o fallback principal para `mockProperties` quando a Edge Function responder sem resultados.
  - Exibir resultados reais vindos da Edge Function.
  - Mostrar mensagem amigável apenas se realmente não houver imóveis compatíveis.
- Em `src/components/SearchBarSection.tsx`:
  - Aplicar a mesma lógica na busca da homepage.
  - Corrigir a busca tradicional para navegar para `/busca`, não `/imoveis`.
  - Usar parâmetros compatíveis com a página de resultados.
- Em `src/pages/SearchResults.tsx`:
  - Ler filtros vindos da URL de forma consistente (`transactionType`, `condominium`, preço, quartos etc.).
  - Tratar `locacao` corretamente nos filtros e na exibição de preço.

6. Corrigir links de compra/locação por condomínio
- Em `src/components/AlphavilleMapSection.tsx`:
  - Considerar `locacao` como disponibilidade de aluguel.
  - O botão “Alugar” aparecerá quando houver imóveis com `transaction_type = locacao`.
  - O clique em Comprar/Alugar continuará levando para `/busca`, mas com filtros compatíveis com o banco.

7. Ajustar detalhe do imóvel para abrir imóveis reais
- Hoje `/imovel/:id` ainda busca em `mockProperties`, então um imóvel real vindo da busca pode abrir o detalhe errado.
- Vou alterar `PropertyDetail.tsx` para carregar o imóvel real do Supabase pelo `id`.
- Manterei um fallback visual seguro caso o imóvel não seja encontrado, mas a prioridade será sempre o cadastro real.

Detalhes técnicos
- Arquivos principais a alterar:
  - `supabase/functions/ai-property-search/index.ts`
  - `src/components/search/SearchHero.tsx`
  - `src/components/SearchBarSection.tsx`
  - `src/pages/SearchResults.tsx`
  - `src/components/AlphavilleMapSection.tsx`
  - `src/pages/PropertyDetail.tsx`
  - possivelmente tipos locais/interfaces compartilhadas onde necessário
- A Edge Function continuará tentando usar Lovable AI quando disponível, mas terá fallback determinístico no backend para 402, 429, erro da IA ou resposta inválida.
- A experiência final não dependerá exclusivamente de créditos de IA para funcionar.

Resultado esperado
- Pesquisar “Casa no alphaville 1” retorna imóveis reais cadastrados no condomínio Alphaville 1.
- Pesquisar por código retorna o imóvel correto.
- Pesquisar “casa para locação no Tamboré 3” retorna imóveis com `transaction_type = locacao`.
- Pesquisar por características descritas no texto do imóvel, como “piscina”, “churrasqueira”, “home theater”, “4 suítes”, passa a funcionar com base nas informações completas do cadastro.
- O erro de créditos insuficientes deixa de quebrar a busca para o usuário final.