# Finalizar prévias ao vivo (WhatsApp) via Cloudflare

## Situação verificada agora
- O domínio www.rafaelalbuquerque.com.br está conectado e no ar.
- Porém os servidores de DNS públicos ainda são do Registro.br (`a.sec.dns.br`, `c.sec.dns.br`), não da Cloudflare. Ou seja: a conta Cloudflare existe, mas o domínio ainda não passa por ela. Sem isso o Worker de prévias não roda.

## Passos
1. **Você (Registro.br):** em "DNS" do domínio, trocar os servidores pelos dois que a Cloudflare mostra ao adicionar o site (ex.: `xxx.ns.cloudflare.com`). Antes, conferir na Cloudflare que existem os registros: A `@` → 185.158.133.1, A `www` → 185.158.133.1, TXT `_lovable` e `_lovable.www` (valores atuais), e e-mail (MX/SPF/DKIM) se houver.
2. **Aguardar** a Cloudflare marcar o site como "Active" (minutos a algumas horas). Eu confirmo pela verificação de domínio.
3. **Eu (com sua aprovação):** conectar a Cloudflare ao projeto e publicar o Worker `cloudflare/og-worker.js` com as rotas `rafaelalbuquerque.com.br/imovel/*`, `/blog/*`, `/sitemap.xml` (e as mesmas para `www.`). Mantém proxy laranja nos registros A; SSL "Full".
4. **Teste:** abrir um imóvel e uma notícia recém-editados e confirmar que título, preço e foto vêm atualizados sem novo deploy (cabeçalho `x-og-source: live`); validar no depurador do Facebook/WhatsApp.

## Detalhes técnicos
- Token Cloudflare necessário: Zone Read, DNS Read, Workers Scripts Edit, Workers Routes Edit.
- Qualquer falha do Worker devolve a página original (sem risco de derrubar o site).
- Nada muda em banco, CRM ou admin.
