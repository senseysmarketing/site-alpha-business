

## Property Detail Page

Create a full property detail page (`/imovel/:id`) following the Coelho da Fonseca reference with the Alpha Business "Quiet Luxury" design system.

### New Files

**1. `src/pages/PropertyDetail.tsx`** -- Main page component with all sections:

- **Gallery Hero** (full-width): Large main image with thumbnail strip at bottom (5 visible + "+N" button). Navigation arrows left/right. Uses existing property images as mock data.
- **Quick Info Bar**: Tags row ("Apartamento", "Alphaville", "Cód: AB1234") followed by price ("R$ 12.500.000"), then horizontal attribute bar with minimalist icons (m², Dorms, Suítes, Vagas). "Agendar visita" and "WhatsApp" buttons on the right.
- **Two-column layout below**:
  - **Left (main content ~65%)**: 
    - "Sobre o Imóvel" editorial description section
    - "Galeria Completa" with categorized photos (Living, Suíte, Gourmet) in a grid
    - "Localização" neighborhood block with description, gastronomia/clubes highlights
  - **Right (sidebar ~35%)**:
    - Sticky broker card with photo placeholder, name, title, "Falar com [Nome]" and "Agendar visita" buttons
    - On mobile: sidebar moves below content, WhatsApp CTA becomes a fixed sticky bar at bottom

**2. `src/components/property/PropertyGallery.tsx`** -- Image carousel with thumbnails, arrow navigation, and "+N ver todas" overlay on last thumbnail.

**3. `src/components/property/PropertySidebar.tsx`** -- Sticky broker profile card with CTA buttons (WhatsApp green button, Agendar visita outline).

**4. `src/components/property/PropertySpecs.tsx`** -- Horizontal specs bar with Lucide icons (Maximize for m², BedDouble for dorms, Bath for suítes, Car for vagas).

**5. `src/components/property/PropertyNeighborhood.tsx`** -- Neighborhood block with image, description, and categorized highlights (Gastronomia, Clubes).

### Modified Files

**`src/App.tsx`**: Add route `<Route path="/imovel/:id" element={<PropertyDetail />} />`.

### Design Details

- All styling follows existing patterns: `text-display` for headings, `text-body` for body, `section-padding`, `glass-panel`, Bordeaux/Cashmere/Greige palette
- Header reused from existing component
- Footer reused from existing component
- Mobile: single column layout, gallery becomes swipeable via Embla carousel, broker sidebar moves below content, fixed WhatsApp sticky bar at bottom (`fixed bottom-0 left-0 right-0 z-40 bg-bordeaux p-4`)
- Mock data hardcoded for the template (no database yet)
- Framer Motion animations: fade-in on scroll for each section, similar to existing components

### Mock Property Data

```typescript
const property = {
  type: "Apartamento",
  neighborhood: "Alphaville",
  code: "AB1234",
  price: "R$ 12.500.000",
  area: "850",
  bedrooms: "5",
  suites: "4",
  parking: "4",
  title: "Residência Altos de Alphaville",
  description: "Residência de alto padrão com 850m² de área construída...",
  images: [property1, property2, property3, property4, mansionModern, familyHome],
  broker: { name: "Carolina Mendes", title: "Corretora especialista" },
  neighborhood: { name: "Alphaville", description: "...", gastronomy: [...], clubs: [...] }
};
```

