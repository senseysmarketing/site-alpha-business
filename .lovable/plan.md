# Prévias de WhatsApp sempre atualizadas (imóveis e notícias) via Cloudflare

## O problema (confirmado pelo print)
Um imóvel cadastrado depois do último deploy aparece no WhatsApp com a prévia genérica da página inicial. A prévia de cada imóvel e notícia só é criada na hora da publicação do site. O WhatsApp não executa o site, então só enxerga o que foi publicado. Tudo que é criado ou alterado depois da publicação fica sem prévia certa até o próximo deploy.

## A solução
A Cloudflare (plano gratuito) fica na frente do domínio rafaelalbuquerque.com.br:

```text
Visitante (pessoa)  -> Cloudflare -> site no Lovable (nada muda)
WhatsApp / Google / -> Cloudflare -> prévia montada na hora
Facebook / LinkedIn                  com os dados do banco
```

- Para pessoas, o site continua o mesmo de hoje.
- Para robôs de prévia (WhatsApp, Facebook, Instagram, LinkedIn, X, Telegram, Slack, Discord, iMessage, Google), a Cloudflare pede ao nosso backend uma página com título, preço, descrição e foto atuais do imóvel ou da notícia.
- Vale para links novos, mudanças de preço, troca de foto ou capa, slug novo e imóveis desativados (estes mostram a prévia geral, sem erro).
- Não precisa mais fazer deploy para atualizar prévias. O deploy continua só para mudanças no visual do site.

## Etapas

1. **Montador de prévias no backend (sem mexer no visual do site)**
   - Nova função que recebe o caminho do link (`/imovel/...`, `/imovel/{uuid}`, URL antiga, `/blog/{slug}`) e acha o imóvel pelo código no fim do link, ou a notícia pelo slug.
   - Devolve uma página leve com título, descrição, foto, canonical na URL nova e os dados estruturados, usando as mesmas regras de URL e texto do build atual. Assim a prévia fica igual à de hoje.
   - Foto leve para o WhatsApp (abaixo de cerca de 600 KB, 1200x630): usar a cópia leve do build quando ela existe. Para itens novos, gerar a versão redimensionada na hora. Antes de escolher como, conferir se o armazenamento do backend permite redimensionar imagens. Se não permitir, gerar a cópia leve quando a foto ou capa for salva.
   - Se o item não existir, devolve a prévia geral do site.

2. **Conta Cloudflare e DNS (feito por você, com meu passo a passo)**
   - Criar a conta gratuita e adicionar o domínio. A Cloudflare copia os registros atuais.
   - Trocar os nameservers no registro.br pelos da Cloudflare. A propagação leva de minutos a algumas horas, sem tirar o site do ar se os registros forem copiados certos.
   - Deixar o e-mail do domínio (registros MX/TXT) exatamente como está.

3. **Regra na Cloudflare (Worker gratuito, até 100 mil acessos por dia)**
   - Só age em `/imovel/*` e `/blog/*`. Robô de prévia vai para o montador; qualquer outro acesso passa direto para o site.
   - Se o montador falhar, o acesso também passa direto para o site. No pior caso a prévia volta a ser a de hoje, e o site nunca cai.
   - Deixar a prévia em cache por cerca de 5 minutos, para mudanças aparecerem rápido sem sobrecarregar o backend.

4. **Ponto de atenção a validar primeiro (antes de trocar o DNS de vez)**
   - O Lovable emite o certificado do domínio e pode não aceitar o domínio "atrás" da Cloudflare (proxy laranja). Plano: testar primeiro em um subdomínio de teste. Se o Lovable recusar, o Worker busca o site em `alphabusiness-launchpad.lovable.app`, desde que esse endereço não redirecione para o domínio próprio, o que criaria um loop. Também precisa ser testado.
   - Plano B, se nenhuma das duas formas funcionar: não migrar o DNS e avisar você antes de seguir.

5. **Testes**
   - Testes automáticos do montador: imóvel por código, por UUID e pela URL antiga; notícia com capa de mobile e de desktop; imóvel inexistente; imóvel desativado.
   - Teste da regra de robôs: o user-agent do WhatsApp recebe a prévia e um navegador comum recebe o site.
   - Teste real: cadastrar ou alterar um imóvel sem fazer deploy e conferir a prévia no WhatsApp e no Facebook Sharing Debugger.

## O que não muda
Banco de dados, CRM, leads, agendamentos, telas do admin, URLs atuais e visual do site. O build atual com páginas estáticas e sitemap continua e serve de reserva.

## Detalhes técnicos
- Edge Function `og-render` (sem JWT, só leitura pública de `properties` ativos e `blog_posts` publicados), reaproveitando `supabase/functions/_shared/property-url.ts` e a lógica de meta de `scripts/generate-og-pages.mjs`, extraída para `_shared/og-meta.ts`.
- Resposta `text/html` com `Cache-Control: public, max-age=300`. Teste Deno `og-render_test.ts`.
- Worker da Cloudflare: regex de user-agent dos robôs e `fetch` para a função com timeout de 3 s. Em caso de erro, faz `fetch(request)` direto para o site.
- O código do Worker fica em `cloudflare/og-worker.js` no projeto, como referência para colar no painel. Não é publicado pelo Lovable.
- Registrar em `AGENTS.md`: prévias sociais são servidas dinamicamente pelo Worker + `og-render`, e o build estático é só reserva.
