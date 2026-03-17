

## Fix: Header sobrepondo o modal de Video Tour

### Problema
O modal de vídeo usa `z-50`, mesmo z-index do header e da utility bar. O header fica por cima do modal e cobre o botão X de fechar.

### Solução

**`src/components/property/VideoTourModal.tsx`** — Aumentar o z-index do overlay e do container do vídeo para `z-[60]`, garantindo que fiquem acima do header (`z-50`) e da utility bar (`z-[51]`).

- `DialogOverlay`: adicionar `z-[60]`
- Container `div`: mudar de `z-50` para `z-[60]`
- Botão X: manter `z-[60]` (herda do container)

