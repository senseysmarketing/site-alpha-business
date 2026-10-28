# Prévias ao vivo (Cloudflare na frente do Lovable)

## Estado original (para reversão)
- Nameservers: `a.sec.dns.br`, `c.sec.dns.br` (registro.br)
- `A @ 185.158.133.1`, `A www 185.158.133.1`
- `TXT @ google-site-verification=vYtffItS2joq1sYtbmcezch11B2Xngffmk5jcG7dLZY`
- Registros `_lovable` / `_lovable.www` (TXT de verificação do Lovable) — copiar os valores atuais do registro.br antes de migrar.

## Passo a passo
1. Teste antes do DNS: criar o Worker com `og-worker.js` e abrir `https://<worker>.workers.dev/imovel/...` — confere `x-og-source: live` e as tags (o Worker busca o site em produção via `fetch(request)` só quando roda na rota do domínio; no workers.dev teste via `curl` o JSON de `og-meta`).
2. Cloudflare: Add site `rafaelalbuquerque.com.br` (plano Free). Conferir que os registros importados batem com a lista acima.
3. Lovable: Project Settings → Domains → reconectar o domínio marcando **Advanced → Uses Cloudflare or similar proxy**; adicionar na Cloudflare os registros que o Lovable mostrar.
4. registro.br: trocar nameservers pelos da Cloudflare (horário de pouco movimento).
5. Cloudflare → Workers → Routes: `rafaelalbuquerque.com.br/imovel/*`, `rafaelalbuquerque.com.br/blog/*`, `rafaelalbuquerque.com.br/sitemap.xml`. Ativar Logs do Worker.
6. Validar: `curl -sI https://rafaelalbuquerque.com.br/imovel/...` → `x-og-source: live`; Facebook Sharing Debugger; WhatsApp.

## Reversão
1. Remover as rotas do Worker (segundos) → site idêntico ao atual.
2. Desligar o proxy laranja dos registros.
3. Voltar os nameservers do registro.br para `a.sec.dns.br` / `c.sec.dns.br`.
