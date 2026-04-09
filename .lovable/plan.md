

## Ajustar margem da tela de Configurações

### Problema
A página `SiteSettings.tsx` tem um wrapper `<div className="max-w-[1400px] mx-auto">` que nenhuma outra página admin usa. As demais (Dashboard, CRM, Marketing, etc.) usam apenas `<div>` ou `<div className="space-y-6">` simples, deixando o `padding: 1.5rem` do `AdminLayout` controlar o espaçamento.

### Solução
Em `src/pages/admin/SiteSettings.tsx` (linha 457):
- Remover `max-w-[1400px] mx-auto` do div wrapper
- Usar `<div className="space-y-6">` para seguir o padrão das outras páginas admin (como Marketing, CRM, etc.)
- Manter o header (h1 + descrição) e o grid de conteúdo como estão

### Arquivo a editar
- `src/pages/admin/SiteSettings.tsx` — linha 457, trocar a classe do wrapper

