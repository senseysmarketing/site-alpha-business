

## Ajustes no Menu Lateral de Filtros

### Problema 1: Botão "Aplicar" com texto escuro invisível
O botão "Aplicar" usa `bg-primary` (Midnight Bordeaux escuro) mas o texto também está escuro. Precisa forçar texto branco/claro.

### Problema 2: Header sobrepondo o drawer de filtros
O Header usa `z-[51]` e o Sheet usa `z-50`. O drawer fica atrás do header.

### Solução

| Arquivo | Mudança |
|---|---|
| `src/components/search/AdvancedFiltersDrawer.tsx` | Adicionar `text-white` ao botão "Aplicar" para garantir visibilidade |
| `src/components/ui/sheet.tsx` | Aumentar z-index do SheetOverlay e SheetContent para `z-[60]` para ficar acima do header |

