# Renomear "Blog" para "Notícias" nas páginas públicas

## Contexto
O usuário quer que todo o conteúdo editorial público seja tratado como "notícias". O menu e o rodapé já mostram "Notícias", mas ainda existem textos dentro das páginas de matéria/artigo que usam "Blog", "Artigo" ou "matéria".

## Alterações propostas

### 1. Página de matéria (`src/pages/BlogPost.tsx`)
- Substituir "Voltar ao Blog" por "Voltar às Notícias" (aparece em dois locais: topo da matéria e estado de "não encontrado").
- Substituir "Artigo não encontrado." por "Notícia não encontrada.".

### 2. Hero do blog (`src/components/blog/BlogHero.tsx`)
- Substituir o CTA "Ler matéria" por "Ler notícia".

## O que NÃO será alterado
- Nomes de componentes, rotas (`/blog`, `/blog/:slug`) e imports internos.
- Tabela `blog_posts` e query keys (`blog-post`, `blog-posts`).
- Labels de categoria (`Inside Alphaville`, etc.).
- Área administrativa (`BlogPosts`, `BlogEditor`, etc.).

## Resultado esperado
O usuário navega em uma matéria e vê apenas referências a "notícias", mantendo a estrutura técnica intacta.
