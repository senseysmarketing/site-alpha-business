---
name: Homepage Hero — Multi-slide Editor
description: Hero alimentado por site_settings.hero.slides (até 5 banners), cada um com tagline, título, subtítulo, CTA e mídia (imagem ou vídeo) próprios
type: feature
---
O `HeroSection` (75-80vh, transparent header overlap) consome `site_settings.hero.slides`: até **5 banners editoriais** rotativos, configurados pelo admin em `/admin/configuracoes`. Cada slide tem campos próprios: `tagline`, `title` (suporta `*itálico*`), `subtitle`, `cta_label`, `cta_href` (interno `/rota` ou externo `https://`), `media_type` (`image` | `video`), `media_url` e `poster_url` opcional.

**CTA**: links externos (começam com `http`) abrem em nova aba (`<a target="_blank">`); demais usam `<Link>` interno do react-router. Botão pill arredondado `rounded-full` em fundo Bordeaux `#2A070C`.

**Mídia**: vídeo renderiza `<video autoPlay muted loop playsInline>`; imagem usa Ken Burns (zoom 1→1.08 em 6s). Cross-fade entre slides com 1.2s. Auto-advance a cada 6s, pausa no hover do conteúdo.

**Limites de upload (admin)**: imagem **5 MB** (JPG/WebP recomendado, 1920×1080), vídeo **15 MB** (MP4 H.264 1080p, ~10s). Validação client-side com toast `destructive` se exceder. Bucket `property-photos/hero-slides/`.

**Admin UI**: bloco "Homepage Hero" lista cards `HeroSlideEditor` (até 5) com header colapsável (thumbnail + título), botões ↑/↓ para reordenar, Trash2 para remover, e `+ Adicionar banner`. Mini Preview lateral mostra slide ativo com dots clicáveis.

**Retrocompatibilidade**: settings antigos (`tagline` + `headline` + `carousel_property_ids`) geram automaticamente 1 slide na primeira carga; admin pode então editar livremente. Campos legacy permanecem no JSON sem efeito visual.

**Fallback**: se `slides` estiver vazio, exibe 3 mockProperties como placeholder para que a home nunca quebre.
