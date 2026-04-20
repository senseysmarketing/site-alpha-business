---
name: Contact Section Redesign
description: Layout 2 colunas com imagem editorial à esquerda e formulário com labels acima à direita
type: feature
---
A `ContactSection` (id `contato`) usa layout em duas colunas (`grid md:grid-cols-2 gap-10 md:gap-16 items-start`) dentro de `max-w-7xl px-6 md:px-12 lg:px-24`, sem fundo cinza (background padrão da página).

**Coluna esquerda**: imagem vertical `aspect-[4/5] rounded-lg overflow-hidden` usando `private-collection.jpg` como visual editorial fixo (object-cover).

**Coluna direita**: header em uma linha — `<h2>` em Noto Serif `text-2xl md:text-4xl font-normal leading-tight mb-8` com texto "Seu imóvel ainda não está na Alpha Business?" (sem eyebrow, sem itálico, sem parágrafo descritivo, alinhado à esquerda).

Formulário `space-y-5` com labels acima dos inputs (Inter `text-sm font-medium mb-2 block`): Nome completo, E-mail, Telefone (máscara BR), Endereço completo do imóvel (textarea). Inputs sem placeholder, fundo `bg-muted/60`, `border-0`, `rounded-md px-4 py-3`. Todos os campos full-width empilhados verticalmente (sem grid 2 colunas).

Botão Enviar pequeno e alinhado à esquerda: `bg-foreground text-background px-8 py-3 rounded-md text-sm` em case natural (preto/escuro, não Bordeaux, não full-width).

A submissão insere lead com `origin: anuncio_proprio`, `pipeline_stage: novos`, `score: morno`, salvando endereço em `ai_insights`. Estado de sucesso mantém ícone CheckCircle + h3 Noto Serif.
