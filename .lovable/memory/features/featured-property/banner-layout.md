---
name: Featured Property Banner
description: Split 50/50 layout — coluna escura textual à esquerda, imagem real à direita com gradiente suave de transição
type: feature
---
O banner de destaque (`FeaturedPropertySection`) usa um grid 50/50 (`md:grid-cols-2`, `min-h-[420px]`, `rounded-lg`). Coluna esquerda em fundo `#1a1a1a` (quase preto, exceção pontual ao Bordeaux do projeto) com conteúdo alinhado à esquerda: tagline uppercase tracking-wide, título em Noto Serif `text-3xl→5xl font-normal` (sem itálico, sem asteriscos por padrão), descrição Inter, e botões `px-6 py-3 border border-white/25 rounded-md` em case natural (não uppercase). Coluna direita exibe a imagem real (`object-cover`, sem overlay full) com um gradiente lateral `w-24 from-[#1a1a1a] to-transparent` na borda esquerda para suavizar a transição entre painel e foto. No mobile empilha (imagem em cima, texto embaixo). Conteúdo configurável via `useSiteSettings("featured_banner")`.
