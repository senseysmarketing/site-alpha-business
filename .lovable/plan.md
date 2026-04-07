

## Adicionar LifestyleSection à Página Inicial

O componente `LifestyleSection` já existe em `src/components/LifestyleSection.tsx` mas não está sendo renderizado porque falta o import e a inclusão no `Index.tsx`.

### Mudança em `src/pages/Index.tsx`

1. Adicionar import: `import LifestyleSection from "@/components/LifestyleSection";`
2. Inserir `<LifestyleSection />` logo após `<FeaturedPropertySection />` (seção "Seleção especial")

Ordem final das seções:
- HeroSection
- SearchBarSection
- NewArrivalsSection
- FeaturedPropertySection (Seleção especial)
- **LifestyleSection** ← aqui
- InstitutionalSection
- TeamSection
- ContactSection
- AlphavilleMapSection

