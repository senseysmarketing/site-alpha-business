

## Ajustes na Página de Detalhes do Imóvel

### Problema 1: Página não rola para o topo ao navegar
Quando o usuário clica em um imóvel, o React Router mantém a posição de scroll da página anterior. Precisa adicionar scroll-to-top na navegação.

### Problema 2: Header cobre o botão de Tour em Vídeo
A galeria usa `pt-[72px]` para compensar o header fixo, mas o header inclui a utility bar (~30px) + nav (~42px) = ~72px. No entanto, o botão "Assistir Tour em Vídeo" fica em `top-6` (24px) dentro da galeria, ficando parcialmente coberto pelo header. Precisa aumentar o padding-top ou ajustar a posição do botão.

### Solução

| Arquivo | Mudança |
|---|---|
| `src/pages/PropertyDetail.tsx` | Adicionar `useEffect` com `window.scrollTo(0, 0)` no mount; aumentar `pt-[72px]` para `pt-[100px]` para dar mais espaço ao header (utility bar + nav) |
| `src/components/property/PropertyGallery.tsx` | Mover botão de vídeo de `top-6` para `top-8` para garantir distância do header |

Alternativamente, pode-se criar um componente `ScrollToTop` global no `App.tsx` que escuta mudanças de rota — mas como a solução mais simples é o `useEffect` no componente, faremos assim por agora.

