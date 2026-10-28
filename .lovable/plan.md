# Finalizar prévias ao vivo (WhatsApp) via Cloudflare

## Situação verificada agora
- O domínio já passa pela Cloudflare (servidores `jasper` e `nia.ns.cloudflare.com`) e o site continua no ar.
- Os registros do site ainda aparecem sem o "proxy laranja" da Cloudflare. Sem ele, o robô que monta as prévias não é acionado.

## Passos (você já autorizou)
1. Conectar sua conta Cloudflare ao projeto (aparece um cartão para escolher/criar a conexão com um token).
2. Conferir os registros do domínio (A `@` e `www` → 185.158.133.1, TXT `_lovable`, e-mail) e ligar o proxy laranja nos dois registros A. SSL em "Full".
3. Publicar o robô de prévias com as rotas `/imovel/*`, `/blog/*` e `/sitemap.xml`, para `rafaelalbuquerque.com.br` e `www.`.
4. Testar um imóvel e uma notícia: título, preço e foto atualizados sem novo deploy; conferir que o site e o painel continuam abrindo normalmente.

## Detalhes técnicos
- Token Cloudflare: Zone Read, DNS Edit, Zone Settings Read, Workers Scripts Edit, Workers Routes Edit.
- Worker = `cloudflare/og-worker.js`; em qualquer falha devolve a página original. Resposta marcada com `x-og-source: live`.
- Ativar proxy pode deixar o domínio no Lovable como "proxy"; se a verificação reclamar, ajustar com a opção "Uses Cloudflare or similar proxy".
- Nada muda em banco, CRM ou admin.
