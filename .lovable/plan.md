

## Ajustes Visuais — Seção Lifestyle

Mudanças em `src/components/LifestyleSection.tsx`:

1. **Fundo branco**: Trocar `bg-foreground` por `bg-background` para conectar com o degradê do vídeo hero
2. **Cores do título**: Label "LIFESTYLE" de `text-white/50` → `text-foreground/50`; título de `text-white` → `text-foreground`; itálico de `text-white/80` → `text-foreground/60`
3. **Espaçamento reduzido**:
   - Seção padding: `py-12 md:py-16` → `py-8 md:py-12`
   - Título container: remover `section-padding` (usa padding excessivo vertical), usar apenas `px-6 md:px-12 lg:px-24` e reduzir `mb-8 md:mb-10` → `mb-4 md:mb-6`
   - Carousel container: trocar `section-padding` por `px-6 md:px-12 lg:px-24` (sem padding vertical extra)
   - Gap entre cards: `gap-6 md:gap-8` → `gap-4 md:gap-6`
4. **Dots e setas**: Dots inativos de `bg-white/30` → `bg-foreground/20`; setas de `text-white/70` → `text-foreground/50`, hover `text-foreground`; dots margin `mt-6` → `mt-4`

