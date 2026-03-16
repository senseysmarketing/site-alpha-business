

## CRM Pipeline Kanban — Quiet Luxury

### Database Changes (Migration)

**1. `leads` table**
- `id` uuid PK, `name` text, `email` text, `phone` text, `avatar_url` text nullable
- `pipeline_stage` text default 'novos' (novos, visita_agendada, proposta, contrato, fechado)
- `score` text default 'morno' (quente, morno, frio)
- `origin` text default 'web' (instagram, whatsapp, web, indicacao)
- `property_id` uuid nullable FK to properties
- `deal_value` numeric nullable
- `ai_insights` text nullable
- `last_contact_at` timestamptz default now()
- `created_at` timestamptz default now(), `updated_at` timestamptz default now()
- RLS: public read for authenticated, admin write

**2. `lead_activities` table**
- `id` uuid PK, `lead_id` uuid FK to leads ON DELETE CASCADE
- `type` text (view, visit_scheduled, whatsapp, call, proposal, document, note)
- `description` text
- `created_at` timestamptz default now()
- RLS: same as leads

**3. `lead_notes` table**
- `id` uuid PK, `lead_id` uuid FK to leads ON DELETE CASCADE
- `content` text, `author` text default 'Admin'
- `created_at` timestamptz default now()
- RLS: same as leads

### Frontend Files

**4. `src/pages/admin/CRM.tsx`** — Main Kanban page
- 5 columns: Novos, Visita Agendada, Proposta, Contrato, Fechado
- Each column header: title + badge with count + summed deal value
- Column backgrounds: slightly lighter off-white (`bg-[#F5F5F3]`) vs page `#F8F8F8`
- Glassmorphism column headers with `backdrop-blur`
- Drag-and-drop using HTML5 native drag API (no external lib needed for simple cases): `onDragStart`, `onDragOver`, `onDrop` — updates `pipeline_stage` in Supabase on drop
- Scale animation on drag via state-driven class (`scale-105 shadow-xl rotate-1`)
- "+" button on each column header to quick-add leads
- Fetches leads joined with property thumbnail

**5. `src/components/admin/crm/LeadCard.tsx`** — Card component
- Avatar with serif initials (font-[Raleway])
- Name, property thumbnail (small), deal value formatted, origin icon (Instagram/WhatsApp/Web)
- Score indicator: Quente = border-[#2A070C] + pulsing flame icon with Bordeaux glow; Morno = border-amber-400; Frio = border-blue-300
- Footer: "Último contato há Xh" using `last_contact_at` with `formatDistanceToNow`
- `draggable`, `onDragStart` sets lead ID
- Click opens LeadDetailSheet

**6. `src/components/admin/crm/LeadDetailSheet.tsx`** — Side drawer (Sheet)
- Uses shadcn Sheet (right side, wider ~480px)
- **Top**: Avatar large + name + email/phone + CTAs: "WhatsApp" (opens `wa.me/{phone}`) + "Agendar Visita" (reuses ScheduleVisitModal)
- **Middle**: Timeline vertical with icons per activity type, fetched from `lead_activities`
- **Bottom**: Notes section (list from `lead_notes` + textarea to add new) + AI Insights card (read-only, displays `ai_insights` field)
- Score badge with glow for "Quente"

**7. `src/components/admin/crm/NewLeadDialog.tsx`** — Quick add dialog
- Simple form: Name, Phone, Email, Origin (select), Property (select from properties), Deal Value
- Inserts into `leads` table with default stage from the column where "+" was clicked

**8. Route registration** — `src/App.tsx`
- Add `<Route path="leads" element={<CRM />} />` inside admin routes

### Visual Identity
- All typography follows Raleway for titles, Inter for body/labels
- Midnight Bordeaux (#2A070C) for hot lead glow, active states
- Cards: white bg, border-border/50, shadow-none, hover:shadow-sm
- Drag state: scale-[1.05] shadow-lg transition-transform

### Key Technical Decisions
- Native HTML5 drag-and-drop (no `react-beautiful-dnd` or `dnd-kit` dependency) — simpler, lighter, sufficient for 5-column Kanban
- `formatDistanceToNow` from date-fns for "Último contato há Xh"
- Sheet component already exists in the project
- ScheduleVisitModal already exists and can be reused from the drawer

