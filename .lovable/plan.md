

## Change

Replace the single gradient overlay (line 31) with two separate overlays: one for mobile (keeps current behavior) and one for desktop that only covers the bottom 15% with a subtle fade to background.

### File: `src/components/HeroSection.tsx` (line 31)

Replace the single gradient div with:
- **Mobile**: Keep `bg-gradient-to-b from-foreground/40 via-foreground/20 to-background` (full overlay)
- **Desktop**: A small gradient only at the bottom ~15% of the section, fading from transparent to `background`, using `top-[85%]` positioning instead of `inset-0`

