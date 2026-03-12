

## Problem

No BlogPost, o conteúdo do artigo (article) usa `max-w-2xl` (672px) enquanto a área do título no hero usa `max-w-3xl` (768px). Isso faz com que, no desktop, o conteúdo não fique alinhado com a margem esquerda do título, criando um desalinhamento visual.

## Solution

Alterar o `max-w-2xl` do article para `max-w-3xl` (mesmo valor do container do título), mantendo o mesmo alinhamento das margens em desktop.

### File: `src/pages/BlogPost.tsx` (line 121)

```text
Alterar:
  <article className="max-w-2xl mx-auto px-6 md:px-12 py-16 md:py-24">

Para:
  <article className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
```

Isso alinha perfeitamente a margem esquerda do conteúdo com a margem do título no hero, criando uma linha visual consistente no desktop.

