
-- 1) unaccent extension
create extension if not exists unaccent with schema extensions;

-- 2) normalization function
create or replace function public.normalize_search_text(input text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select trim(regexp_replace(lower(extensions.unaccent(coalesce(input, ''))), '\s+', ' ', 'g'));
$$;

-- 3) normalized column on properties
alter table public.properties
  add column if not exists condominium_normalized text;

update public.properties
  set condominium_normalized = public.normalize_search_text(condominium)
  where condominium is not null
    and (condominium_normalized is null or condominium_normalized <> public.normalize_search_text(condominium));

create index if not exists idx_properties_condominium_normalized
  on public.properties (condominium_normalized);

-- 4) trigger to keep it fresh
create or replace function public.set_property_normalized_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.condominium_normalized := public.normalize_search_text(new.condominium);
  return new;
end;
$$;

drop trigger if exists trg_properties_normalized_fields on public.properties;
create trigger trg_properties_normalized_fields
  before insert or update of condominium on public.properties
  for each row execute function public.set_property_normalized_fields();

-- 5) aliases table
create table if not exists public.condominium_aliases (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  canonical_normalized text not null,
  alias_text text not null,
  alias_normalized text not null,
  created_at timestamptz not null default now(),
  unique (alias_normalized)
);

grant select on public.condominium_aliases to anon, authenticated;
grant all on public.condominium_aliases to service_role;

alter table public.condominium_aliases enable row level security;

create policy "Condominium aliases are publicly readable"
  on public.condominium_aliases for select
  using (true);

create policy "Admins manage condominium aliases"
  on public.condominium_aliases for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 6) seed common aliases
insert into public.condominium_aliases (canonical_name, canonical_normalized, alias_text, alias_normalized) values
  ('Tambore 1',  'tambore 1',  'Tamboré 1',  public.normalize_search_text('Tamboré 1')),
  ('Tambore 1',  'tambore 1',  'Tambore 1',  public.normalize_search_text('Tambore 1')),
  ('Tambore 1',  'tambore 1',  'Tamboré I',  public.normalize_search_text('Tamboré I')),
  ('Tambore 2',  'tambore 2',  'Tamboré 2',  public.normalize_search_text('Tamboré 2')),
  ('Tambore 2',  'tambore 2',  'Tambore 2',  public.normalize_search_text('Tambore 2')),
  ('Tambore 2',  'tambore 2',  'Tamboré II', public.normalize_search_text('Tamboré II')),
  ('Tambore 3',  'tambore 3',  'Tamboré 3',  public.normalize_search_text('Tamboré 3')),
  ('Tambore 3',  'tambore 3',  'Tambore 3',  public.normalize_search_text('Tambore 3')),
  ('Tambore 4',  'tambore 4',  'Tamboré 4',  public.normalize_search_text('Tamboré 4')),
  ('Tambore 4',  'tambore 4',  'Tambore 4',  public.normalize_search_text('Tambore 4')),
  ('Tambore 5',  'tambore 5',  'Tamboré 5',  public.normalize_search_text('Tamboré 5')),
  ('Tambore 5',  'tambore 5',  'Tambore 5',  public.normalize_search_text('Tambore 5')),
  ('Tambore 6',  'tambore 6',  'Tamboré 6',  public.normalize_search_text('Tamboré 6')),
  ('Tambore 6',  'tambore 6',  'Tambore 6',  public.normalize_search_text('Tambore 6')),
  ('Tambore 7',  'tambore 7',  'Tamboré 7',  public.normalize_search_text('Tamboré 7')),
  ('Tambore 7',  'tambore 7',  'Tambore 7',  public.normalize_search_text('Tambore 7')),
  ('Tambore 8',  'tambore 8',  'Tamboré 8',  public.normalize_search_text('Tamboré 8')),
  ('Tambore 8',  'tambore 8',  'Tambore 8',  public.normalize_search_text('Tambore 8')),
  ('Tambore 9',  'tambore 9',  'Tamboré 9',  public.normalize_search_text('Tamboré 9')),
  ('Tambore 9',  'tambore 9',  'Tambore 9',  public.normalize_search_text('Tambore 9')),
  ('Tambore 10', 'tambore 10', 'Tamboré 10', public.normalize_search_text('Tamboré 10')),
  ('Tambore 10', 'tambore 10', 'Tambore 10', public.normalize_search_text('Tambore 10')),
  ('Tambore 11', 'tambore 11', 'Tamboré 11', public.normalize_search_text('Tamboré 11')),
  ('Tambore 11', 'tambore 11', 'Tambore 11', public.normalize_search_text('Tambore 11'))
on conflict (alias_normalized) do nothing;
