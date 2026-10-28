# Prévias e SEO sempre atualizados (imóveis e notícias) com Cloudflare na frente do Lovable

## Objetivo
Todo imóvel ou notícia criado, alterado ou despublicado no admin passa a ter a prévia certa no WhatsApp, Facebook, LinkedIn e Google, com título, descrição e imagem atuais. Isso funciona sem novo deploy no Lovable. A hospedagem continua no Lovable, e React, Vite, Supabase e GitHub ficam como estão.

## Situação atual do domínio (conferida hoje)
- O DNS fica no registro.br (`a.sec.dns.br`, `c.sec.dns.br`).
- `rafaelalbuquerque.com.br` aponta para o registro A `185.158.133.1` e é o domínio principal.
- `www` também aponta para o A `185.158.133.1` e redireciona (302) para o domínio sem www.
- Também existe um TXT de verificação do Google Search Console, que precisa ser mantido.
- O endereço `alphabusiness-launchpad.lovable.app` redireciona para o domínio principal. Por isso o Worker **não** pode buscar o site por esse endereço, porque criaria um loop. Ele precisa buscar pelo próprio domínio, no modo proxy oficial do Lovable.
- O Lovable já roda atrás da Cloudflare. Para pôr a nossa Cloudflare na frente, use o caminho documentado: na conexão do domínio, ative "Uses Cloudflare or similar proxy" (Advanced). Com isso a verificação passa a ser feita por CNAME, que funciona com o proxy ligado.
- Não há registros de e-mail (MX) no domínio raiz. Mesmo assim, vou conferir isso de novo antes de migrar.

## Arquitetura

```text
Qualquer visitante (pessoa ou robô)
        |
   Cloudflare (nossa zona) -- Worker só em /imovel/* e /blog/*
        |  1. busca o HTML original do Lovable
        |  2. busca os dados públicos do item (cache curto)
        |  3. HTMLRewriter troca title, description, canonical,
        |     og:*, twitter:*, JSON-LD e o resumo estático
        v
   Lovable (hospedagem atual, sem mudanças) -> o React carrega normal
```

- **Mesma resposta para todos**: pessoas, robôs de prévia e buscadores recebem o mesmo HTML. Não há separação por user-agent, então não existe conteúdo diferente para robôs.
- Fora de `/imovel/*` e `/blog/*`, o Worker não age.
- O build estático atual continua como reserva. Se o Worker falhar, o visitante recebe exatamente o que recebe hoje.

## Etapas

### 1. Regras únicas de metadados (sem duplicar lógica)
- Tirar de `scripts/generate-og-pages.mjs` as regras de título, descrição, canonical, og/twitter e JSON-LD e levá-las para um módulo compartilhado. O módulo de URL do imóvel já está nesse formato.
- O build, a função do backend e o Worker passam a usar as mesmas regras. Testes garantem que os três geram as mesmas tags.

### 2. Função pública de metadados no backend
- Uma nova função recebe o caminho e responde em JSON só com campos públicos: título, descrição, URL canônica, imagem social, JSON-LD e status.
- Ela usa só a chave pública e as regras de acesso que já existem. Assim lê apenas imóveis ativos e notícias publicadas, sem chave privilegiada e sem campos internos.
- Como ela encontra o item:
  - Imóvel pelo **código** no fim da URL nova ou da URL amigável antiga, ou pelo **UUID** na URL antiga.
  - Notícia pelo **slug**.
- Respostas:
  - `ok`: devolve os metadados atuais.
  - `moved`: o item existe, mas o caminho mudou (troca de título, condomínio ou tipo). O Worker faz **um único redirecionamento 301** para a URL canônica, sem cadeias.
  - `inactive`: imóvel desativado ou notícia despublicada. Mostra a prévia "Imóvel indisponível" ou "Notícia indisponível" com a marca. Nunca mostra preço nem foto como se o item estivesse ativo. Vai junto o `noindex` e o canonical para a busca da categoria.
  - `not_found`: devolve o status 404 com uma prévia neutra e `noindex`.
- Antes da implementação, vou confirmar se as regras de acesso atuais deixam o público ver o status de imóveis inativos. Se não deixarem, a função trata o caso como "indisponível" sem expor dados.

### 3. Imagens sociais leves, criadas uma vez só
- Criar uma pasta pública `social-images` no armazenamento, com arquivos JPG de 1200×630 e no máximo cerca de 300 KB.
- O nome do arquivo inclui uma versão (um hash da imagem de origem). Quando a foto ou a capa muda, o endereço também muda, e o WhatsApp é obrigado a buscar a nova imagem.
- Geração por evento: quando um imóvel é criado ou tem a foto principal trocada (inclusive pela sincronização da Kenlo), ou quando uma notícia tem a capa trocada, o banco avisa uma função de processamento, que gera a versão leve e grava o endereço.
  - Notícia: usa `cover_image`. A capa mobile só é usada se não houver capa de desktop, porque 1200×630 é um formato horizontal.
- Imagens externas (fotos da Kenlo) também são baixadas uma vez e convertidas.
- Para o que já existe hoje, uma carga inicial usa a mesma rotina.
- Ordem de reserva para a imagem: imagem social pronta → original, se for leve → imagem padrão da marca, 1200×630.
- Os metadados só leem o endereço já gravado. Nenhuma imagem é processada quando alguém acessa um link.
- Antes da implementação, vou conferir se o backend tem uma biblioteca de imagem que funcione dentro do limite de tempo da função. Se não tiver, o plano B é gerar a imagem pelo serviço de imagens da própria Cloudflare (Image Resizing, que pode ser pago). Aviso o custo antes, se for o caso.
- Esta etapa precisa de mudanças no banco: um campo para o endereço da imagem social nos imóveis e nas notícias, e o aviso ao salvar. Essas mudanças só acrescentam coisas e não alteram dados existentes.

### 4. Cache e atualização
- Os metadados ficam em cache na Cloudflare por 60 segundos, com `stale-while-revalidate` de 5 minutos. Assim, mudanças aparecem em cerca de 1 minuto, e o banco recebe no máximo cerca de 1 consulta por minuto por link popular.
- A invalidação imediata, que exige limpar o cache da Cloudflare a cada mudança, fica como melhoria futura. O cache de 60 segundos já resolve sem custo extra.
- O HTML do Lovable continua sem cache, como hoje.
- WhatsApp e Facebook guardam as próprias prévias por dias, e nós não controlamos isso. Isso afeta só links que já foram compartilhados. Links novos funcionam na primeira vez. Para forçar uma atualização: usar o Facebook Sharing Debugger ou acrescentar `?v=2` ao link.

### 5. SEO, sitemap e conteúdo indexável
- O HTML inicial já chega com uma única tag de cada tipo. O HTMLRewriter **substitui** as tags existentes em vez de acrescentar, e um teste verifica que não há tags duplicadas.
- Sitemap dinâmico: `/sitemap.xml` passa a ser gerado pelo Worker a partir do banco, com cache de 1 hora. Ele inclui itens novos e alterados e remove os despublicados, sempre com URLs canônicas e `lastmod` real. O sitemap do build continua como reserva.
- O resumo estático que o build coloca na página para robôs também é atualizado pelo Worker, com dados do banco.

### 6. Segurança, disponibilidade e monitoramento
- O Worker guarda só o endereço da função e a chave pública. Ele nunca guarda a chave privilegiada.
- Tempo limite de 1,5 s para a consulta de metadados. Em caso de falha, tempo esgotado, limite de acessos ou resposta inválida, o Worker devolve o HTML original do Lovable sem mudanças, que é o comportamento de hoje.
- Se uma imagem estiver indisponível, usa a imagem padrão da marca.
- Logs: a função registra tempo, status e falhas. Os registros e as métricas do Worker ficam ativos no painel da Cloudflare, com um cabeçalho `x-og-source: live|fallback` em cada resposta para diagnóstico.
- Limites gratuitos do Worker: 100 mil acessos por dia. O site deve ficar bem abaixo disso nas rotas cobertas, mas vou conferir isso nas métricas do Lovable antes.

### 7. Implantação segura e reversão
1. **Tudo validado antes de mexer no DNS**: função, imagens, testes e um Worker em ambiente de teste (`*.workers.dev`) apontando para o site atual.
2. Você cria a conta gratuita na Cloudflare e adiciona o domínio. Comparamos os registros importados com a lista acima: A, www e o TXT do Google.
3. No Lovable, reconecta o domínio no modo "Cloudflare proxy" seguindo as instruções do próprio Lovable, que pedem os registros de CNAME de verificação.
4. Troca dos nameservers no registro.br, no horário de menor movimento.
5. Testes em produção: site com e sem www, certificado SSL, redirecionamentos, imóvel novo sem deploy, notícia, imóvel inativo e 404. Validar no WhatsApp e no Facebook Debugger.
6. **Reversão** em três níveis:
   - Desligar a rota do Worker: efeito em segundos, e o site volta a ser exatamente o de hoje.
   - Desligar o proxy laranja.
   - No pior caso, voltar os nameservers do registro.br para `a.sec.dns.br` e `c.sec.dns.br`, com os registros originais documentados.

## O que não muda
CRM, leads, agendamentos, telas do admin, regras de acesso existentes, URLs atuais, visual do site e o processo de publicação no Lovable.

## Detalhes técnicos
- `supabase/functions/_shared/og-meta.ts`: regras de meta e JSON-LD, usadas pelo build, pela função e pelo Worker. O Worker recebe uma cópia gerada por script, para não divergir.
- Edge Function `og-meta` (sem JWT, com cliente anon e `Cache-Control: public, max-age=60, stale-while-revalidate=300`) e Edge Function `social-image` (acionada por Database Webhook em INSERT/UPDATE de `photos[0]`, `cover_image` e `cover_image_mobile`; grava em `social-images/{tipo}/{id}-{hash}.jpg`).
- Migração: colunas `social_image_url` em `properties` e `blog_posts`, mais a pasta pública `social-images`.
- Worker em `cloudflare/og-worker.ts` no projeto, com rotas `rafaelalbuquerque.com.br/imovel/*`, `/blog/*` e `/sitemap.xml`. Ele usa `HTMLRewriter` sobre `title`, `meta[name=description]`, `link[rel=canonical]`, `meta[property^=og:]`, `meta[name^=twitter:]`, `script[type="application/ld+json"]` e o bloco estático.
- Testes: Deno para `og-meta` (código, UUID, URL antiga, mudança de slug com 301, inativo, 404, notícia com e sem capa) e para a regra de "sem tags duplicadas". Vitest para a paridade entre o build e o módulo compartilhado.
- `AGENTS.md`: os metadados públicos são gerados na hora pelo Worker com a `og-meta`, e o build estático é reserva.
