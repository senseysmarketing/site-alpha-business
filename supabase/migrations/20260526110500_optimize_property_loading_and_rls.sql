-- Property search/listing indexes aligned with the public filters and admin screens.
create index if not exists idx_properties_active_listing
  on public.properties (status, transaction_type, is_featured desc, created_at desc);

create index if not exists idx_properties_active_condominium
  on public.properties (status, condominium)
  where condominium is not null;

create index if not exists idx_properties_active_location
  on public.properties (status, city, neighborhood);

create index if not exists idx_properties_active_sale_price
  on public.properties (price)
  where status = 'ativo'
    and transaction_type = 'venda'
    and price is not null;

create index if not exists idx_properties_active_rental_price
  on public.properties (rental_price)
  where status = 'ativo'
    and transaction_type in ('locacao', 'aluguel')
    and rental_price is not null;

-- Foreign-key indexes reported by Supabase performance advisors.
create index if not exists idx_expenses_property_id
  on public.expenses (property_id);

create index if not exists idx_lead_activities_lead_id
  on public.lead_activities (lead_id);

create index if not exists idx_lead_notes_lead_id
  on public.lead_notes (lead_id);

create index if not exists idx_leads_property_id
  on public.leads (property_id);

create index if not exists idx_site_settings_updated_by
  on public.site_settings (updated_by);

create index if not exists idx_system_audit_logs_user_id
  on public.system_audit_logs (user_id);

create index if not exists idx_transactions_broker_user_id
  on public.transactions (broker_user_id);

create index if not exists idx_transactions_property_id
  on public.transactions (property_id);

-- properties_code_key already enforces uniqueness; keep one unique constraint.
alter table public.properties
  drop constraint if exists properties_code_unique;

-- RLS initPlan optimizations: wrap stable auth calls in SELECT so they are
-- evaluated once per statement instead of once per row.
drop policy if exists "Admins can insert properties" on public.properties;
create policy "Admins can insert properties"
  on public.properties for insert
  to authenticated
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can update properties" on public.properties;
create policy "Admins can update properties"
  on public.properties for update
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can delete properties"
  on public.properties for delete
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can insert condominiums" on public.condominiums;
create policy "Admins can insert condominiums"
  on public.condominiums for insert
  to authenticated
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can update condominiums" on public.condominiums;
create policy "Admins can update condominiums"
  on public.condominiums for update
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can delete condominiums" on public.condominiums;
create policy "Admins can delete condominiums"
  on public.condominiums for delete
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can insert leads" on public.leads;
create policy "Admins can insert leads"
  on public.leads for insert
  to authenticated
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can update leads" on public.leads;
create policy "Admins can update leads"
  on public.leads for update
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can delete leads" on public.leads;
create policy "Admins can delete leads"
  on public.leads for delete
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can manage site_settings" on public.site_settings;
create policy "Admins can manage site_settings"
  on public.site_settings for all
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can read visits" on public.visits_scheduling;
create policy "Admins can read visits"
  on public.visits_scheduling for select
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "Users can read own roles" on public.user_roles;
create policy "Users can read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Keep public forms open, but replace always-true checks with basic shape
-- validation so accidental empty/spam rows are rejected at the database edge.
drop policy if exists "Anyone can create leads from public forms" on public.leads;
create policy "Anyone can create leads from public forms"
  on public.leads for insert
  to anon, authenticated
  with check (
    length(btrim(name)) between 2 and 160
    and (email is null or length(btrim(email)) <= 254)
    and (phone is null or length(regexp_replace(phone, '\D', '', 'g')) between 10 and 15)
    and pipeline_stage in ('novos', 'visita_agendada', 'proposta', 'contrato', 'fechado')
  );

drop policy if exists "Anyone can create visit scheduling" on public.visits_scheduling;
create policy "Anyone can create visit scheduling"
  on public.visits_scheduling for insert
  to anon, authenticated
  with check (
    length(btrim(property_code)) between 1 and 80
    and length(btrim(broker_name)) between 2 and 160
    and length(btrim(lead_name)) between 2 and 160
    and length(regexp_replace(lead_phone, '\D', '', 'g')) between 10 and 15
    and length(btrim(lead_email)) <= 254
  );
