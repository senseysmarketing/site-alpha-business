---
name: Team Carousel
description: Seção Nossa Equipe com header em 1 linha, avatares circulares grandes e dots Bordeaux unificados
type: feature
---
A seção `TeamSection` segue o padrão editorial das demais seções do home: header em uma linha (`flex items-center justify-between mb-10`) com `<h2>Nossa Equipe</h2>` em Noto Serif `text-2xl md:text-3xl font-normal` à esquerda e link "Ver todos" → `#contato` em Inter `text-sm text-foreground/70` à direita. Sem eyebrow, sem botões de chevron de navegação.

Carrossel Embla com `align: start, containScroll: trimSnaps, slidesToScroll: 1`. Slides: 2 visíveis no mobile (`flex-[0_0_50%]`) e 4 no desktop (`md:flex-[0_0_25%]`), `gap-8`. Cards limpos sem wrapper branco — apenas avatar circular `w-32 h-32 md:w-36 md:h-36 rounded-full` (com fallback de inicial em gradient) + nome em Noto Serif `text-base font-normal` + cargo em Inter `text-sm text-muted-foreground`, todos centralizados.

Dots de paginação Bordeaux unificados (mesmo padrão de Lifestyle/Redes Sociais), visíveis em todos os breakpoints, baseados em `emblaApi.scrollSnapList()`: ativo é `w-7 h-7 rounded-md bg-primary` com quadrado branco interno (`w-2 h-2 bg-background rounded-sm`), inativo é dot cinza pequeno (`w-2 h-2 rounded-full bg-muted-foreground/30`). Dados vêm de `useSiteSettings("team")` com fallback `defaultTeam`.
