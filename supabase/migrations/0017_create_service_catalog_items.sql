-- Create service_catalog_items table if not exists
create table if not exists public.service_catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_catalog_items enable row level security;

create policy "catalog items public select" on public.service_catalog_items for select using (true);
create policy "catalog items admin manage" on public.service_catalog_items for all using (public.has_role('platform_admin')) with check (public.has_role('platform_admin'));
