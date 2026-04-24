# Project Memory

## Core
- **Aesthetic**: 'Quiet Luxury'. Off-white bg (#F8F8F8), neutral tones (Cashmere/Greige), Midnight Bordeaux (#2A070C) accents.
- **Typography**: Noto Serif (300/400/500/600 + italic) para títulos e headings. Inter para corpo, UI e labels. Cormorant Garamond e Raleway removidos.
- **Shapes**: Generous rounding everywhere. `--radius: 0.75rem` é o padrão (propaga via shadcn). Controles de mídia e botões pill usam `rounded-full`. Aplica-se ao site público E ao painel admin.

- **Formatting**: Currency in BRL. Phones use BR mask `(XX) XXXXX-XXXX`. IG usernames prefix with `@`.
- **Z-Index**: Header z-50, Utility Bar z-[51], Overlays/Modals/Drawers z-[60] to ensure top visibility.
- **Architecture**: Supabase backend (RLS for public read/admin write). Framer Motion for scrollytelling.

## Memories
- [Visual Identity](mem://style/visual-identity) — Complete design tokens, brand colors, and typography rules
- [Bento Box Pattern](mem://style/layout-patterns/bento-box) — Core layout structure for complex interfaces
- [Loading Strategy](mem://ux/loading-strategy) — Cinematic preloader and opacity transitions for fluid loading
- [Frontend Animations](mem://tech/frontend/animations) — Scrollytelling and Shared Element Transitions via layoutId
- [Header & Navigation](mem://features/header/navigation) — Transparent to Bordeaux transition, simplified menu
- [Footer Standard](mem://features/footer/footer-standard) — Bordeaux layout, institutional info, legal text formatting
- [Homepage Hero](mem://features/hero/carousel-layout) — Embla carousel, 70vh height, transparent header overlap
- [Floating Search Bar](mem://features/search/floating-search-bar) — AI vs Traditional toggle, inline results panel
- [Search Results Layout](mem://features/search/results-layout) — Magazine style, Bento grid 4/5 cards, cinematic hero
- [Traditional Search Filters](mem://features/search/traditional-filters) — Select-based filters with URLSearchParams redirect
- [Search Fallback Strategy](mem://features/search/fallback-strategy) — Local mock data fallback when AI search fails
- [AI Concierge Panel](mem://features/search/ai-concierge-panel-ui) — Glassmorphism results panel, fade-in animations, dynamic chips
- [Advanced Search Tools](mem://features/search/advanced-tools) — Progressive disclosure drawer, visual comparator, concierge
- [Property Cards Layout](mem://features/property/cards-standard-formatting) — BRL prices, technical specs with thin icons, badges
- [Featured Property Banner](mem://features/featured-property/banner-layout) — Two-column dark layout with specific condo actions
- [Lifestyle Section](mem://features/lifestyle/layout-content) — Vertical 4:3 image cards, no overlays, italicized titles
- [Alphaville Condo Grid](mem://features/alphaville/condo-grid) — Dynamic text grid of active condos with buy/rent links
- [Private Collection Layout](mem://features/private-collection/layout) — Bordeaux background with Sticky Image Mask scrollytelling
- [Social Media Feed](mem://features/institutional/social-media-static-feed) — Static scraped images, hover zoom, 20% Bordeaux overlay
- [Team Carousel](mem://features/team/layout-carousel) — Circular avatars driven dynamically by site settings
- [Contact Section Redesign](mem://features/contact/redesign) — Clean aesthetic for lead capture focused on property listing
- [Property Detail Layout](mem://features/property-detail/layout) — max-w-7xl, gallery top-0, transparent header, video tour button
- [Visit Scheduling Modal](mem://features/property-detail/visit-scheduling) — Glassmorphism flow, date/time logic, lead form
- [Blog Article Layout](mem://features/blog/layout) — Desktop max-w-3xl container aligning with hero title
- [Property Advertisement Form](mem://features/forms/property-advertisement) — Two-block modal for lead generation with BR masks
- [Automated Lead Capture](mem://features/crm/automated-lead-capture) — Origin mapping and RLS logic for all capture forms
- [Admin Layout Standard](mem://features/admin/layout) — Quiet Luxury admin aesthetic, Glassmorphism header, global padding
- [Admin Access Control](mem://auth/admin-access) — RBAC via user_roles and has_role RPC, async auth checks
- [Admin Property Management](mem://features/admin/property-management) — Filter groups, AI-powered creation wizard via Web Speech/Gemini
- [Data Entry Standards](mem://features/admin/data-entry-standards) — Normalized condo names, pure number prices, luxury tags
- [Bulk Import System](mem://features/admin/bulk-import) — 5-step wizard with PapaParse, CSV templates, batch processing
- [CRM Kanban Pipeline](mem://features/admin/crm-kanban-structure) — 5-stage pipeline, origin icons, Sentiment Score
- [Visit Agenda Management](mem://features/admin/agenda) — Calendar UI and daily check-in sidebar with map links
- [Financial Management](mem://features/admin/financial-management-crud) — BRL input masks, Recharts visualizations, net revenue KPIs
- [Marketing & Alerts](mem://features/admin/marketing-automation) — Smart priorities, AI micro-plans, WhatsApp response simulator
- [Reports & Intelligence](mem://features/admin/reports) — Sales cycle calculation, real net revenue formula, Alpha Insight
- [Blog CMS Workflow](mem://features/admin/blog-cms) — Zen mode editor, AI article generator, published_at status
- [Social Highlights Config](mem://features/admin/social-highlights) — IG URL scraping config, manual fallback logic
- [Identity & Brand Control](mem://features/admin/identity-control) — 7-block Bento Hub for site content and design tokens
- [Homepage Featured Carousel](mem://features/admin/homepage-featured-carousel) — Curate up to 6 properties for the home "Nossas propriedades especiais" carousel
- [Audit Activity Log](mem://features/admin/audit-log) — Real pagination, 15 items/page, render cycle prevention
