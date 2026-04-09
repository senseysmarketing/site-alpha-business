

## Ajustes na Página de Detalhes do Imóvel

### Problema 1: Header branco/invisível
O Header usa texto branco sobre fundo transparente. Na página inicial funciona porque o HeroSection tem imagem escura por trás. Na página de detalhes, a galeria começa em `pt-[100px]`, deixando fundo off-white atrás do header — texto branco fica invisível.

**Solução**: Aceitar uma prop `variant` no Header. Na página de detalhes, usar `variant="solid"` que força o fundo `bg-[#2A070C]` sempre (não só após scroll). Alternativamente, remover o `pt-[100px]` e fazer a galeria começar do topo (atrás do header), igual o HeroSection na página inicial — assim o header transparente fica sobre a imagem da galeria.

**Abordagem escolhida**: Remover o `pt-[100px]` e fazer a galeria ocupar desde o topo, com o header transparente sobreposto à imagem (igual à home). Isso é mais consistente visualmente.

### Problema 2: Alinhar layout da página de detalhes ao padrão visual

**Mudanças em `src/pages/PropertyDetail.tsx`:**
- Remover `pt-[100px]` da galeria — galeria começa do topo da viewport
- Envolver seções de conteúdo em `max-w-7xl mx-auto` para consistência de largura com a home
- Usar `section-padding` onde aplicável

**Mudanças em `src/components/property/PropertyGallery.tsx`:**
- Ajustar a galeria desktop para começar do topo da tela (sem padding-top), permitindo que o header fique sobreposto transparente sobre a imagem principal

### Arquivos a editar
1. **`src/pages/PropertyDetail.tsx`** — remover `pt-[100px]`, adicionar `max-w-7xl mx-auto` nos containers de conteúdo
2. **`src/components/property/PropertyGallery.tsx`** — sem mudanças estruturais, apenas garantir que funciona sem o padding-top

