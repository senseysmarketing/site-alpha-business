---
name: Lifestyle Section
description: Cards clicáveis e arrastáveis (Embla dragFree) com filtro por tag em /busca; modelo Opção A reaproveitando engineering_highlights
type: feature
---
A seção Lifestyle segue o padrão editorial de "Nossas Propriedades": header em uma linha (título Noto Serif à esquerda com final em font-semibold, link "Ver todos" → /busca à direita), cards sólidos brancos (`bg-card border border-border/60 rounded-lg shadow-sm`) com imagem 4:3 no topo e título dentro do card (p-5, Noto Serif). Carrossel Embla com dragFree, 3 visíveis no desktop / 1 no mobile. Dots Bordeaux (ativo = w-7 h-7 rounded-md bg-primary com quadrado branco interno).

**Cards são clicáveis e arrastáveis.** Cada card vira `<Link>` para `/busca?tag={cat.tag}` (ou `/busca` se sem tag). Drag-vs-click é distinguido via pointerDown/pointerMove com threshold de 5px e `onClickCapture` que cancela navegação se houve drag — assim o usuário pode arrastar livremente sem disparar navegação.

**Modelo de categorização (Opção A — sem migração SQL):** Cada card no admin (`/admin/configuracoes` → "Categorias de Lifestyle") tem campo extra "Tag de filtro". O filtro reaproveita `engineering_highlights` (já existente em `properties`). Para incluir um imóvel numa categoria, basta adicionar a mesma palavra/tag em "Destaques de Engenharia" no `PropertyForm`. O form mostra as tags de lifestyle como chips clicáveis acima da lista de destaques (estado `already` quando já presente). A busca normaliza acentos e busca a tag em highlights + título + condomínio + relevance_reason. Um `Badge` rounded-full no toolbar de `/busca` mostra a tag ativa e permite remover.

**Como criar nova categoria (admin):** 1) `/admin/configuracoes` → adicionar/editar card de Lifestyle (título, imagem, tag ex: `praia`). 2) `/admin/imoveis/editar/:id` → marcar `praia` em Destaques (chip de sugestão acelera). 3) Home → card linka para `/busca?tag=praia`.
