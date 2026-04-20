---
name: Social Media Feed
description: Seção Redes Sociais com header em 1 linha, dois handles, badge de play, e thumbnails persistidas em Supabase Storage
type: feature
---
A seção `InstitutionalSection` (id `#about`) usa header em uma linha: à esquerda `<h2>Redes Sociais</h2>` em Noto Serif `text-2xl/3xl font-normal`; à direita ícone Instagram + "Siga-nos:" + dois handles clicáveis (`@AlphavilleSP` e `@AlphavilleAB` por padrão; configuráveis via `site_settings.contact.instagram` e `instagram_secondary`). Grid `grid-cols-1 md:grid-cols-3 gap-6` com cards `aspect-[4/5] rounded-lg`, hover apenas `scale-[1.02]` (sem overlay escuro). Cada card tem badge fixo de Play no canto superior direito (`top-3 right-3 w-7 h-7 rounded-md bg-white/85`). Sem CTA "Seguir no Instagram" abaixo do grid — o CTA vive no header.

**Persistência de thumbnails**: a Edge Function `scrape-instagram-thumbnail` baixa a imagem do `og:image` do Instagram e faz upload no bucket público `instagram-thumbnails` (Supabase Storage), usando hash SHA-1 da URL do post como filename (determinístico, upsert). Retorna a URL pública permanente do bucket — elimina o problema de URLs CDN do Instagram que expiram. Fallback gracioso: se o upload falhar, retorna a URL CDN original. URLs antigas que ainda funcionam continuam até expirar; admin pode clicar "Recarregar" no painel para migrá-las.
