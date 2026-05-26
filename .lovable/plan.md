## Objetivo
Mostrar todos os 6 posts do Instagram configurados no admin (atualmente cortados em 3) através de um carrossel arrastável na seção "Redes Sociais" da home.

## Arquivo
- `src/components/InstitutionalSection.tsx`

## Mudanças
1. Remover `instaPosts.slice(0, 3)` — usar todos os posts retornados (até 6).
2. Substituir o `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">` pelo componente shadcn `Carousel` (`@/components/ui/carousel`, baseado em Embla, já instalado no projeto), com:
   - `opts={{ align: "start", dragFree: true, loop: false }}`
   - `CarouselItem` com classes responsivas: `basis-[80%] sm:basis-1/2 md:basis-1/3` para revelar parcialmente o próximo card no mobile (affordance de arraste) e manter 3 por vez no desktop.
   - Manter o card atual (motion.a com thumbnail, badge Play, hover scale, aspect-[4/5]).
3. Adicionar `CarouselPrevious` / `CarouselNext` visíveis apenas em `md:` (desktop), posicionados nas bordas. No mobile o gesto de arrastar é suficiente.
4. Manter fallback (3 skeletons) quando não houver posts.
5. Sem mudanças de estilo/cores/tipografia — apenas estrutura. Sem alterações no admin nem no schema.

## Fora do escopo
- Auto-play, dots/indicadores, paginação.
- Mudanças no painel admin de Destaques Social.