# Corrigir imagem dos previews das notícias (WhatsApp e outros)

## Diagnóstico (confirmado no site publicado)
- A página da notícia já informa a imagem de capa corretamente aos aplicativos de mensagem — o deploy funcionou.
- O problema é o tamanho do arquivo: a capa é um PNG de **2,8 MB**. O WhatsApp descarta imagens de preview acima de ~600 KB e mostra o link sem foto (exatamente o que aparece no print). LinkedIn/Facebook também ficam lentos ou falham.

## O que será feito
1. Durante a publicação, gerar automaticamente uma versão leve da capa de cada notícia: JPG 1200x630 (proporção ideal de compartilhamento), cerca de 100–250 KB.
2. Apontar a imagem de compartilhamento das notícias para essa versão leve, hospedada no próprio site. A capa exibida na página continua a original.
3. Aplicar o mesmo tratamento à foto principal dos imóveis, que pode ter o mesmo problema.
4. Se a imagem original falhar ao baixar, manter a imagem atual como reserva (nunca sem imagem).
5. Informar largura, altura e tipo da imagem nas tags de compartilhamento.
6. Validar: conferir tamanho dos arquivos gerados e as tags da notícia do print; depois publicar.

Após publicar, o WhatsApp pode manter o preview antigo em cache para links já enviados; um link novo (ou com `?v=2` no fim) mostra a foto.

## Detalhes técnicos
- `scripts/generate-og-pages.mjs`: baixar `cover_image` / foto principal, redimensionar com `sharp` (cover 1200x630, jpeg q≈80, mozjpeg) para `dist/og/blog/{slug}.jpg` e `dist/og/imovel/{code}.jpg`, com concorrência limitada e fallback para a URL original.
- `og:image`, `twitter:image`, `og:image:width/height/type`, `og:image:secure_url` com URL absoluta do domínio.
- Adicionar `sharp` como dependência de desenvolvimento.
