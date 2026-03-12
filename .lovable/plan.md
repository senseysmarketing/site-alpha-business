

## "Agendar Visita" - Modal Funcional com Supabase

### Database

Create a `visits_scheduling` table via migration:

```sql
CREATE TABLE public.visits_scheduling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_code text NOT NULL,
  broker_name text NOT NULL,
  visit_date date NOT NULL,
  visit_time text NOT NULL,
  lead_name text NOT NULL,
  lead_phone text NOT NULL,
  lead_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public insert (no auth required for leads)
CREATE POLICY "Anyone can create visit scheduling"
  ON public.visits_scheduling FOR INSERT
  TO public WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read visits"
  ON public.visits_scheduling FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
```

### New Component: `src/components/property/ScheduleVisitModal.tsx`

A multi-step dialog with 3 steps + confirmation:

**Step 1 - Date**: shadcn Calendar with `pointer-events-auto`. Disable Sundays (`day.getDay() === 0`) and a hardcoded list of Brazilian holidays for 2026. Past dates also disabled.

**Step 2 - Time**: Grid of 1-hour slots (09:00–18:00). Styled as selectable cards in the neutral palette, selected state uses Bordeaux.

**Step 3 - Contact form**: Name, Phone (Brazilian cell mask `(XX) XXXXX-XXXX`), Email. Validated with zod. Phone mask applied via simple `onChange` handler (no extra library).

**Step 4 - Success**: Animated checkmark (framer-motion scale+opacity), thank-you message mentioning the broker's first name.

Dialog overlay uses `backdrop-blur-sm` for glassmorphism. Confirmation button uses `bg-[hsl(var(--bordeaux))]` (Midnight Bordeaux). Navigation between steps with "Voltar"/"Continuar" buttons.

On submit: insert into `visits_scheduling` via Supabase client. Show toast on error.

### Modified Files

**`src/components/property/PropertySidebar.tsx`**: Import and render `ScheduleVisitModal`, pass `propertyCode` and `brokerName` props. Wrap "Agendar visita" button with Dialog trigger.

**`src/pages/PropertyDetail.tsx`**: Pass `propertyCode={property.code}` to `PropertySidebar`. Also wire the "Agendar visita" button in the Quick Info bar to open the same modal.

