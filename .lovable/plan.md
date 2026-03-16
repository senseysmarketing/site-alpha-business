

## Refined Property Detail Page — "Quiet Luxury" Upgrade

### Overview

Major overhaul of the property detail page with a hero grid gallery, video tour modal, Cormorant Garamond typography, accordion for technical details, similar properties carousel, and refined micro-interactions.

### Files to Change

---

**1. `src/index.css`** — Add Cormorant Garamond font import and a `.text-serif` utility class + `.font-mono` already available via Tailwind default.

Add to the Google Fonts import: `family=Cormorant+Garamond:wght@300;400;500;600&`

Add component class:
```css
.text-serif { font-family: 'Cormorant Garamond', serif; }
```

---

**2. `src/components/property/PropertyGallery.tsx`** — Complete rewrite.

Replace the carousel with a **hero grid layout**:
- Desktop: CSS grid with 1 large image (left, spans 2 rows) + 2 smaller images (right, stacked). All with hover zoom.
- Mobile: Single image with swipe dots.
- Bottom-right overlay: "Explorar todas as fotos" button (opens a lightbox modal with all images).
- Top-right overlay on the main image: "Assistir Tour em Vídeo" button with play icon. On click, opens a **fullscreen Dialog** with `backdrop-blur-xl`, containing a centered `<video>` element using the existing `/videos/hero-bg.mp4` as placeholder.

Props change: `images: string[]` stays, add optional `videoUrl?: string`.

---

**3. `src/components/property/PropertySpecs.tsx`** — Typography refinement.

- Icons: reduce `strokeWidth` to `1` for ultra-thin lines.
- Values: use `font-mono` class for numeric values (Tailwind built-in monospace).
- Keep the same layout structure.

---

**4. `src/pages/PropertyDetail.tsx`** — Major restructuring.

**Gallery section**: Pass `videoUrl="/videos/hero-bg.mp4"` to `PropertyGallery`.

**Quick Info bar**: 
- Property title uses `text-serif` (Cormorant Garamond) instead of `text-display`.
- Keep tags, price, specs bar, and CTA buttons.

**Main content column**:
- **"Sobre o Imóvel"**: Keep as editorial narrative (already good).
- **Remove** the "Galeria Completa" grid section entirely. Replace with a single "Explorar todas as fotos" minimal button (links back to gallery lightbox or scrolls to top).
- **Technical details accordion**: New section "Detalhes do Imóvel" using shadcn `Accordion` with items for "Documentação", "IPTU & Condomínio", "Características Técnicas". Hardcoded mock content.
- **Neighborhood** section stays.

**Similar Properties section**: After the two-column layout, before Footer. A new section "Imóveis que você também pode gostar" with a horizontal scrollable row of 4 property cards (reuse mock data from `NewArrivalsSection`). Each card: image, title, location, price. Links to `/imovel/:id`.

**Mobile sticky bar**: Keep the WhatsApp bar. Add "Agendar visita" button next to it so mobile users always see both CTAs.

---

**5. `src/components/property/PropertySidebar.tsx`** — Already sticky (`sticky top-24`). No structural change needed. Add subtle `CRECI` credential text below broker info for authenticity.

---

**6. New: `src/components/property/VideoTourModal.tsx`** — Fullscreen video dialog.

- Uses `Dialog` from shadcn with custom overlay (`backdrop-blur-xl bg-black/90`).
- Centered `<video>` with `controls autoPlay` using the passed `videoUrl`.
- Close button (X) top-right.

---

**7. New: `src/components/property/PhotoLightbox.tsx`** — Fullscreen photo gallery modal.

- Uses `Dialog` with dark overlay.
- Shows all images in a single-image view with prev/next arrows and counter.
- Triggered by "Explorar todas as fotos" button.

---

### Shared Element Transition (Framer Motion)

Add `layoutId={`property-image-${id}`}` to the property card images in `NewArrivalsSection.tsx` and to the main hero image in `PropertyGallery.tsx`. Wrap routes with `AnimatePresence` in `App.tsx` using `useLocation`. This creates a smooth shared-element transition when navigating from homepage cards to the detail page.

**`src/components/NewArrivalsSection.tsx`**: Wrap each card in a `<Link to={`/imovel/${prop.id}`}>`. Add `layoutId={`property-${prop.id}`}` to the image's `motion.div`.

**`src/App.tsx`**: Wrap `<Routes>` with `<AnimatePresence mode="wait">` and use `useLocation` for the key.

---

### Summary of New Files
1. `src/components/property/VideoTourModal.tsx`
2. `src/components/property/PhotoLightbox.tsx`

### Summary of Modified Files
1. `src/index.css` — Add Cormorant Garamond font
2. `src/components/property/PropertyGallery.tsx` — Hero grid + video/lightbox triggers
3. `src/components/property/PropertySpecs.tsx` — Ultra-thin icons + monospace values
4. `src/pages/PropertyDetail.tsx` — New structure with accordion, similar properties, serif title
5. `src/components/property/PropertySidebar.tsx` — Add CRECI text
6. `src/components/NewArrivalsSection.tsx` — Add links + layoutId for shared transition
7. `src/App.tsx` — AnimatePresence wrapper for route transitions

