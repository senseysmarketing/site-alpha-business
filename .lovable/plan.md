

## Adicionar busca e scroll ao seletor de imóveis do carrossel

### Problema
O dropdown de seleção de imóveis usa um `Select` simples do shadcn/ui, que não tem campo de busca nem scroll limitado. Com muitos imóveis, a lista ficará gigantesca e difícil de navegar.

### Solução
Substituir o `Select` por um **Popover + Command** (componente Combobox do shadcn), que já inclui:
- Campo de pesquisa integrado (filtra por código ou título)
- Scroll vertical com altura máxima limitada (`max-h-60` ~240px)
- Mesmo visual consistente com o design system

### Mudanças em `src/pages/admin/SiteSettings.tsx`

No componente `PropertyMultiSelect` (linhas 174-249):

1. **Trocar imports**: Remover `Select, SelectContent, SelectItem, SelectTrigger, SelectValue`. Adicionar `Popover, PopoverContent, PopoverTrigger` e `Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList`.

2. **Substituir o `<Select>`** por um `<Popover>` com:
   - `PopoverTrigger` estilizado como o botão atual ("Adicionar imóvel...")
   - `PopoverContent` contendo um `<Command>` com:
     - `<CommandInput>` para pesquisa (placeholder: "Buscar por código ou nome...")
     - `<CommandList>` com `className="max-h-60 overflow-y-auto"` para scroll limitado
     - `<CommandEmpty>` com mensagem "Nenhum imóvel encontrado"
     - `<CommandGroup>` mapeando `availableProperties`
     - `<CommandItem>` exibindo `{p.code} — {p.title}`, ao clicar chama `addProperty(p.id)` e fecha o popover

3. **Estado local** `open` para controlar abertura/fechamento do Popover

