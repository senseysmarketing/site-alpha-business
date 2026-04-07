

## Ajustes no LifestyleSection — Título e Botões

### Diferenças identificadas comparando com NewArrivalsSection

1. **Título**: NewArrivals usa `flex items-end justify-between` (não `items-center`), e o destaque usa `<em className="italic">` (itálico, sem negrito). Lifestyle usa `items-center` e `<span className="font-bold">`.

2. **Botões**: NewArrivals usa `ChevronLeft size={18}` (não `h-5 w-5`), `hidden md:flex items-center gap-2` (não `!isMobile`), e não tem `disabled` nem `flex-shrink-0 ml-8`.

### Mudanças em `src/components/LifestyleSection.tsx`

**Título (linhas 66-70):**
- Trocar `items-center` por `items-end`
- Trocar `<span className="font-bold">estilo de vida</span>` por `<em className="italic">estilo de vida</em>`

**Botões (linhas 72-91):**
- Trocar `{!isMobile && (<div className="flex gap-2 flex-shrink-0 ml-8">...)}` por exatamente o mesmo bloco do NewArrivals:
```tsx
<div className="hidden md:flex items-center gap-2">
  <button onClick={() => emblaApi?.scrollPrev()} className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md">
    <ChevronLeft size={18} />
  </button>
  <button onClick={() => emblaApi?.scrollNext()} className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md">
    <ChevronRight size={18} />
  </button>
</div>
```
- Remove `disabled` props e `disabled:opacity-40` (NewArrivals não tem)
- Remove states `canScrollPrev`/`canScrollNext` (ficam sem uso)

