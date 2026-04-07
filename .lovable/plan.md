

## Ajustes Visuais na LifestyleSection

### Problemas
1. **Título grande demais** — usa `text-3xl md:text-5xl`, enquanto NewArrivals usa `text-2xl md:text-4xl`
2. **Botões com cor diferente** — usa `Button variant="outline"` (que tem bg-background e hover:bg-accent), enquanto NewArrivals usa `<button>` nativo com classes `border border-border text-foreground hover:bg-muted`
3. **Largura não bate** — usa `py-8 md:py-12` e `px-4 md:px-6`, enquanto NewArrivals usa `section-padding` (que inclui `px-6 md:px-12 lg:px-24 py-20 md:py-32`)

### Mudanças em `src/components/LifestyleSection.tsx`

1. **Container**: trocar `py-8 md:py-12` + `px-4 md:px-6` por `section-padding` (igual NewArrivals)
2. **Título**: trocar `text-3xl md:text-5xl` por `text-2xl md:text-4xl` e adicionar `max-w-lg`
3. **Botões de navegação**: trocar `<Button variant="outline">` por `<button>` nativo com as mesmas classes da NewArrivals: `w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md`
4. **Margem do header**: trocar `mb-4 md:mb-6` por `mb-12` (igual NewArrivals)

