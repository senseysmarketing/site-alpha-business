

## Refinamento do Header e Sistema de Busca

### Mudanças

**1. `src/components/Header.tsx`**

- Remove "Private" from `navItems` array
- Increase nav gap from `gap-10` to `gap-12` for balanced spacing
- Add a **utility bar** above the main header: ultra-thin strip (`h-8`) with light background (`bg-[hsl(30,25%,94%)]`), containing Instagram icon (lucide `Instagram`) on the left and phone number `(11) 9999-9999` with `Phone` icon on the right. Hidden on mobile.
- Adjust the fixed header's `top` offset: utility bar is static (scrolls away) while main nav stays fixed. Alternative: both fixed, main nav at `top-8`.

**2. `src/components/HeroSection.tsx`**

- Update placeholder text to: `"Busque por nome, código ou região..."` to signal code search support.
- Add 3 quick-link pills below the search bar (inside the same `motion.div` wrapper):
  - "Casas em Condomínio", "Mansões Exclusive", "Lançamentos"
  - Styled as minimal text links with `text-xs uppercase tracking-wide text-cashmere/70 hover:text-cashmere` separated by subtle dots or pipes.
  - Wrapped in a flex row with `mt-4 gap-4 justify-center`.

### Files Modified
1. `src/components/Header.tsx` — Remove Private, add utility bar, adjust spacing
2. `src/components/HeroSection.tsx` — Update placeholder, add quick links below search

